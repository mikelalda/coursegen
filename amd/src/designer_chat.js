// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * FP Euskadi Designer interactive chat module.
 *
 * Implements a chat-first interface where the orchestrator agent
 * gathers requirements through conversation before starting
 * the multi-phase instructional design process.
 *
 * @module     local_coursegen/designer_chat
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Modal from "core/modal";
import Templates from "core/templates";
import Notification from "core/notification";
import { get_string } from "core/str";
import {
  designerStart,
  designerMessage,
  designerUpload,
  designerFiles,
  planCourseExecute,
} from "local_coursegen/repository/chatbot";
import {
  startExecutionStreaming,
} from "local_coursegen/course_streaming";

let currentModal = null;

/**
 * Follow the conversation while the user is at the bottom ("stick to bottom").
 * Scrolling up stops it; coming back to the bottom starts it again.
 */
let stickToBottom = true;
/** scrollTop we set ourselves, so our own scroll is not taken as the user's. */
let programmaticScrollTop = null;
const NEAR_BOTTOM_PX = 48;

/** Same limits as designer_upload.php and the backend. */
const ATTACH_MAX_BYTES = 10 * 1024 * 1024;
const ATTACH_EXTENSIONS = ["pdf", "docx", "xlsx", "txt", "md", "markdown", "csv", "json", "html", "htm"];

/**
 * The element that scrolls: the messages area (see styles.css), or the modal
 * body if the theme lets the whole body scroll instead.
 * @param {Element} container - The messages container
 * @returns {Element}
 */
const getScroller = (container) => {
  if (container.scrollHeight > container.clientHeight + 1) {
    return container;
  }
  return container.closest(".modal-body") || container;
};

/**
 * Keep the latest text in view while the user is following the conversation.
 * @param {Element} container - The messages container
 * @param {boolean} force - Follow again even if the user had scrolled up (they just sent a message)
 */
const scrollToBottom = (container, force = false) => {
  if (force) {
    stickToBottom = true;
  }
  if (!stickToBottom) {
    return;
  }
  const scroller = getScroller(container);
  scroller.scrollTop = scroller.scrollHeight;
  programmaticScrollTop = scroller.scrollTop;
};

/**
 * Track whether the user is at the bottom, on whichever element scrolls.
 * @param {Element} messagesContainer - The messages container
 */
const watchScroll = (messagesContainer) => {
  const onScroll = (event) => {
    const scroller = event.currentTarget;
    if (programmaticScrollTop !== null && Math.abs(scroller.scrollTop - programmaticScrollTop) < 2) {
      return; // Our own scroll.
    }
    programmaticScrollTop = null;
    stickToBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= NEAR_BOTTOM_PX;
  };
  messagesContainer.addEventListener("scroll", onScroll, {passive: true});
  const modalBody = messagesContainer.closest(".modal-body");
  if (modalBody) {
    modalBody.addEventListener("scroll", onScroll, {passive: true});
  }
};

/**
 * Build the HTML of a sent attachment chip.
 * @param {string} name - File name
 * @returns {string}
 */
const attachmentChipHtml = (name) => `
  <span class="local_coursegen_attachment_chip">
    <i class="fa fa-paperclip" aria-hidden="true"></i><span class="chip-name">${escapeHtml(name)}</span>
  </span>
`;

/**
 * Refresh the "Design files" panel: design document plus generated Excel/Word.
 * @param {Element} container - Modal body element
 * @param {number} courseid - Course ID
 */
const refreshFiles = async (container, courseid) => {
  const list = container.querySelector('[data-region="designer-files-list"]');
  const empty = container.querySelector('[data-region="designer-files-empty"]');
  const count = container.querySelector('[data-region="designer-files-count"]');
  if (!list) {
    return;
  }
  let files = [];
  try {
    const response = await designerFiles({courseid});
    files = response.success ? response.files : [];
  } catch (_) {
    return; // Keep the previous list: the panel is a convenience, not critical.
  }
  const designLabel = await get_string("designer_file_design", "local_coursegen");
  const latestLabel = await get_string("designer_file_latest", "local_coursegen");
  const latestVersion = files.find((file) => file.kind === "version");
  list.innerHTML = files.map((file) => {
    const icon = /\.xlsx$/i.test(file.name) ? "fa-file-excel-o" : /\.docx$/i.test(file.name) ? "fa-file-word-o" : "fa-file-text-o";
    const size = file.size > 1024 ? `${Math.round(file.size / 1024)} KB` : `${file.size} B`;
    let tag = "";
    if (file.kind === "design") {
      tag = ` <span class="badge bg-info text-dark">${escapeHtml(designLabel)}</span>`;
    } else if (file === latestVersion) {
      tag = ` <span class="badge bg-success">${escapeHtml(latestLabel)}</span>`;
    }
    return `<li class="d-flex align-items-center gap-2 py-1">
      <i class="fa ${icon} text-muted" aria-hidden="true"></i>
      <a href="${escapeHtml(file.url)}" download>${escapeHtml(file.name)}</a>${tag}
      <small class="text-muted ms-auto">${size}</small>
    </li>`;
  }).join("");
  empty.hidden = files.length > 0;
  count.textContent = String(files.length);
};

/**
 * Add a message bubble to the chat.
 * @param {Element} messagesContainer - Messages container element
 * @param {string} content - Message content (HTML supported for AI)
 * @param {string} role - 'user' or 'ai'
 * @param {string[]} attachments - File names sent with a user message
 * @returns {Element} The response content element (for AI messages)
 */
const addMessage = (messagesContainer, content, role, attachments = []) => {
  const msgDiv = document.createElement("div");
  msgDiv.className = `local_coursegen_ai_msg ${role} mb-3`;

  if (role === "user") {
    const chips = attachments.length
      ? `<div class="d-flex flex-wrap gap-2 ${content ? "mt-2" : ""}">${attachments.map(attachmentChipHtml).join("")}</div>`
      : "";
    msgDiv.innerHTML = `
      <div class="d-flex justify-content-end">
        <div class="bubble bg-primary text-white rounded p-3" style="max-width: 80%;">
          ${content ? renderMarkdown(content) : ""}
          ${chips}
        </div>
      </div>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom(messagesContainer, true);
    return null;
  }

  // AI message with avatar
  const responseId = "ai-response-" + Date.now();
  msgDiv.innerHTML = `
    <div class="d-flex align-items-start">
      <div class="designer-avatar me-2 flex-shrink-0">
        <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center"
             style="width: 2rem; height: 2rem;">
          <i class="fa fa-graduation-cap text-white" style="font-size: 0.9rem;"></i>
        </div>
      </div>
      <div class="bubble bg-light rounded p-3 flex-grow-1">
        <div id="${responseId}" data-region="designer-ai-response"></div>
      </div>
    </div>
  `;
  messagesContainer.appendChild(msgDiv);
  scrollToBottom(messagesContainer);
  return document.getElementById(responseId);
};

/**
 * Escape HTML entities.
 * @param {string} text
 * @returns {string}
 */
const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Detect structured HTML already prepared by the backend.
 * @param {string} text
 * @returns {boolean}
 */
const looksLikeStructuredHtml = (text) => {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return false;
  }

  const structuredTagPattern =
    /<(section|article|div|p|ul|ol|li|h[1-6]|table|thead|tbody|tr|td|th|blockquote|pre)\b/i;
  return normalized.includes("local-coursegen-plan") || structuredTagPattern.test(normalized);
};

/**
 * Render inline markdown after the source has been HTML-escaped.
 * @param {string} text
 * @returns {string}
 */
const renderInlineMarkdown = (text) => {
  return String(text || "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[$\s).,!?:;]|$)/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[$\s).,!?:;]|$)/g, "$1<em>$2</em>");
};

/**
 * Split a markdown pipe-table row into cells.
 * @param {string} line
 * @returns {string[]}
 */
const splitTableRow = (line) => {
  return String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => renderInlineMarkdown(cell.trim()));
};

/**
 * Render markdown into safe HTML for chat bubbles.
 * @param {string} text
 * @returns {string}
 */
const renderMarkdown = (text) => {
  const normalized = String(text || "").replace(/\r\n?/g, "\n");
  const escaped = escapeHtml(normalized);
  const codeBlocks = [];

  const withPlaceholders = escaped.replace(/```([a-z0-9_-]+)?\n?([\s\S]*?)```/gi, (_, language, code) => {
    const placeholder = `@@CODEBLOCK_${codeBlocks.length}@@`;
    const langClass = language ? ` class="language-${language.toLowerCase()}"` : "";
    codeBlocks.push(`<pre><code${langClass}>${String(code || "").replace(/^\n+|\n+$/g, "")}</code></pre>`);
    return placeholder;
  });

  const lines = withPlaceholders.split("\n");
  const html = [];
  let paragraphLines = [];
  let listType = null;
  let listItems = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }
    html.push(`<p>${renderInlineMarkdown(paragraphLines.join("<br>"))}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }
    html.push(`<${listType}>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^@@CODEBLOCK_\d+@@$/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push(trimmed);
      continue;
    }

    const tableDivider = lines[index + 1] ? lines[index + 1].trim() : "";
    if (trimmed.includes("|") && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(tableDivider)) {
      flushParagraph();
      flushList();

      const headers = splitTableRow(trimmed);
      const rows = [];
      index += 2;

      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index++;
      }

      index--;
      const headRow = headers.map((cell) => `<th>${cell}</th>`).join("");
      const bodyRows = rows
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
        .join("");
      html.push(
        `<table><thead><tr>${headRow}</tr></thead><tbody>${bodyRows}</tbody></table>`
      );
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push("<hr>");
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(unorderedMatch[1]);
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      html.push(`<blockquote><p>${renderInlineMarkdown(quoteMatch[1])}</p></blockquote>`);
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  let rendered = html.join("");
  rendered = rendered.replace(/@@CODEBLOCK_(\d+)@@/g, (_, codeIndex) => codeBlocks[Number(codeIndex)] || "");
  return `<div class="local_coursegen_markdown">${rendered}</div>`;
};

/**
 * Render assistant content preserving backend HTML blocks and formatting markdown otherwise.
 * @param {string} text
 * @returns {string}
 */
const renderAssistantContent = (text) => {
  if (looksLikeStructuredHtml(text)) {
    return `<div class="local_coursegen_markdown">${String(text || "")}</div>`;
  }
  return renderMarkdown(text);
};

/**
 * Stream an AI response from an EventSource URL into a target element.
 *
 * The designer sends one segment per message: `designer_delta` appends tokens
 * as the model writes them, `designer_segment` sets a segment's final text, and
 * `designer_thinking` shows or hides the "Thinking..." line while the model has
 * not written anything yet. `assistant_token` (the greeting) appends plain text.
 *
 * @param {string} streamingUrl - SSE endpoint URL
 * @param {Element} targetElement - Element to render tokens into
 * @param {Element} messagesContainer - Messages container for scrolling
 * @param {string} thinkingLabel - "Thinking..." in the user's language
 * @returns {Promise<Object>} Resolves with status data when complete
 */
const streamResponse = (streamingUrl, targetElement, messagesContainer, thinkingLabel = "") => {
  return new Promise((resolve, reject) => {
    const segments = [];
    let plainText = "";
    let thinking = Boolean(thinkingLabel);
    let rafPending = false;
    let lastStatus = null;

    const currentText = () => [plainText, ...segments].filter((part) => part && part.trim()).join("\n\n");

    const thinkingHtml = () => `
      <div class="local_coursegen_designer_thinking d-flex align-items-center text-muted small mt-2" role="status">
        <span class="spinner-grow spinner-grow-sm me-2" aria-hidden="true"></span>${escapeHtml(thinkingLabel)}
      </div>`;

    const render = () => {
      const text = currentText();
      targetElement.innerHTML = (text ? renderAssistantContent(text) : "") + (thinking && thinkingLabel ? thinkingHtml() : "");
      scrollToBottom(messagesContainer);
    };

    const updateHtml = () => {
      if (rafPending) {
        return;
      }
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        render();
      });
    };

    const parse = (data) => {
      try {
        return JSON.parse(data);
      } catch (_) {
        return null;
      }
    };

    // Show the indicator straight away, before the first event.
    render();

    const evtSource = new EventSource(streamingUrl);

    evtSource.addEventListener("assistant_token", (event) => {
      plainText += event.data;
      thinking = false;
      updateHtml();
    });

    evtSource.addEventListener("designer_delta", (event) => {
      const payload = parse(event.data);
      if (payload) {
        segments[payload.seg] = (segments[payload.seg] || "") + payload.text;
        thinking = false;
        updateHtml();
      }
    });

    evtSource.addEventListener("designer_segment", (event) => {
      const payload = parse(event.data);
      if (payload) {
        segments[payload.seg] = payload.text;
        updateHtml();
      }
    });

    evtSource.addEventListener("designer_thinking", (event) => {
      const payload = parse(event.data);
      thinking = Boolean(payload && payload.active);
      updateHtml();
    });

    evtSource.addEventListener("designer_status", (event) => {
      lastStatus = parse(event.data) || lastStatus;
    });

    evtSource.addEventListener("assistant_message_end", () => {
      thinking = false;
      render();
      evtSource.close();
      resolve(lastStatus || {});
    });

    evtSource.addEventListener("error", (event) => {
      thinking = false;
      render();
      if (event.data) {
        targetElement.innerHTML += `<div class="text-danger mt-2"><small>${escapeHtml(event.data)}</small></div>`;
      }
      evtSource.close();
      reject(new Error(event.data || "Stream error"));
    });

    evtSource.onerror = () => {
      // EventSource connection error — treat as end
      evtSource.close();
      thinking = false;
      if (currentText()) {
        render();
        resolve(lastStatus || {});
      } else {
        reject(new Error("Connection lost"));
      }
    };
  });
};

/**
 * Initialize and show the designer chat modal.
 * @param {Object} params - Parameters
 * @param {number} params.courseid - Course ID
 * @returns {Promise}
 */
export const init = async (params = {}) => {
  try {
    if (currentModal) {
      currentModal.destroy();
      currentModal = null;
    }

    const [title, bodyHTML, footerHTML] = await Promise.all([
      get_string("designer_chat_title", "local_coursegen"),
      Templates.render("local_coursegen/designer_chat_modal", {}),
      Templates.render("local_coursegen/add_course_ai_modal_footer", {}),
    ]);

    currentModal = await Modal.create({
      title: title,
      body: bodyHTML,
      footer: footerHTML,
      large: true,
      scrollable: true,
      removeOnClose: true,
    });

    currentModal.getRoot().addClass("local_coursegen_designer_modal");
    currentModal.show();

    const bodyEl = currentModal.getBody()[0];
    stickToBottom = true;
    programmaticScrollTop = null;
    watchScroll(bodyEl.querySelector("#designer-chat-messages"));

    // "New conversation": confirm, then reopen the modal discarding the saved one.
    const newConversationBtn = bodyEl.querySelector('[data-action="designer-new-conversation"]');
    if (newConversationBtn) {
      newConversationBtn.addEventListener("click", async () => {
        try {
          await Notification.saveCancelPromise(
            await get_string("designer_new_conversation", "local_coursegen"),
            await get_string("designer_new_conversation_confirm", "local_coursegen"),
            await get_string("designer_new_conversation", "local_coursegen"),
          );
        } catch (_) {
          return; // Cancelled.
        }
        await init({...params, newsession: true});
      });
    }

    // Start (or resume) the designer session.
    await startDesignerChat(bodyEl, params);

    return currentModal;
  } catch (error) {
    Notification.exception(error);
    return null;
  }
};

/**
 * Start the designer chat session and wire up the chat form.
 * @param {Element} container - Modal body element
 * @param {Object} params - Parameters including courseid
 */
const startDesignerChat = async (container, params) => {
  const messagesContainer = container.querySelector("#designer-chat-messages");
  const chatForm = container.querySelector("#designer-chat-form");
  const chatInput = container.querySelector("#designerChatInput");
  const sendBtn = container.querySelector("#designer-send-btn");
  const initialResponse = container.querySelector("#designer-ai-response");
  const attachBtn = container.querySelector('[data-action="designer-attach"]');
  const attachInput = container.querySelector('[data-region="designer-attach-input"]');
  const attachmentsRegion = container.querySelector('[data-region="designer-attachments"]');
  const newConversationBtn = container.querySelector('[data-action="designer-new-conversation"]');

  // 1. Start (or resume) the designer session via AJAX.
  let sessionData;
  try {
    const result = await designerStart({
      courseid: params.courseid,
      newsession: Boolean(params.newsession),
      lang: params.lang || "",
    });
    if (!result.success) {
      const errMsg = result.message || 'Error al iniciar la sesión del diseñador';
      initialResponse.innerHTML = `<div class="text-danger">${escapeHtml(errMsg)}</div>`;
      return;
    }
    sessionData = result.data;
  } catch (error) {
    const errMsg = error.message || 'No se pudo conectar con el servicio del diseñador';
    initialResponse.innerHTML = `<div class="text-danger">${escapeHtml(errMsg)}</div>`;
    return;
  }

  if (newConversationBtn) {
    newConversationBtn.disabled = false;
  }
  // Language of the conversation: changing it reopens the same conversation in
  // the new language (and makes it the course's AI language).
  const languageSelect = container.querySelector('[data-region="designer-language"]');
  if (languageSelect && sessionData && sessionData.lang) {
    languageSelect.value = sessionData.lang;
    languageSelect.disabled = false;
    languageSelect.addEventListener("change", () => {
      void init({courseid: params.courseid, lang: languageSelect.value});
    });
  }
  const filesBtn = container.querySelector('[data-action="designer-toggle-files"]');
  const filesPanel = container.querySelector('[data-region="designer-files-panel"]');
  if (filesBtn && filesPanel) {
    filesBtn.disabled = false;
    filesBtn.addEventListener("click", () => {
      filesPanel.hidden = !filesPanel.hidden;
      filesBtn.setAttribute("aria-expanded", String(!filesPanel.hidden));
      if (!filesPanel.hidden) {
        void refreshFiles(container, params.courseid);
      }
    });
  }
  void refreshFiles(container, params.courseid);

  // 2. Resumed: paint the saved conversation. New: stream the greeting.
  if (sessionData && sessionData.resumed) {
    initialResponse.closest(".local_coursegen_ai_msg").remove();
    (sessionData.history || []).forEach((item) => {
      if (item.role === "user") {
        addMessage(messagesContainer, item.content, "user", item.attachments || []);
      } else {
        addMessage(messagesContainer, "", "ai").innerHTML = renderAssistantContent(item.content);
      }
    });
    const note = document.createElement("div");
    note.className = "text-center text-muted small mb-3";
    note.textContent = await get_string("designer_resumed", "local_coursegen");
    messagesContainer.appendChild(note);
    scrollToBottom(messagesContainer);

    if (sessionData.readytogenerate) {
      await handlePhaseTransition(container, params, {siguiente_agente: "end"}, messagesContainer);
    }
  } else if (!sessionData || !sessionData.streamingurl) {
    initialResponse.innerHTML = `<div class="text-danger">Error: no se recibió URL de streaming</div>`;
    return;
  } else {
    try {
      await streamResponse(sessionData.streamingurl, initialResponse, messagesContainer);
    } catch (error) {
      const errMsg = error.message || 'Se perdió la conexión con el diseñador';
      initialResponse.innerHTML = `<div class="text-danger mt-2">${escapeHtml(errMsg)}</div>`;
    }
  }

  // Attachments waiting for the next message: {key, id, name, uploading, chip}.
  let pending = [];
  let sending = false;

  const updateControls = () => {
    const uploading = pending.some((item) => item.uploading);
    sendBtn.disabled = sending || uploading;
    chatInput.disabled = sending;
    if (attachBtn) {
      attachBtn.disabled = sending;
    }
  };

  const removePending = (item) => {
    pending = pending.filter((other) => other !== item);
    item.chip.remove();
    updateControls();
  };

  const renderChip = async (item, error = "") => {
    const removeLabel = await get_string("designer_attach_remove", "local_coursegen", item.name);
    let label = escapeHtml(item.name);
    if (item.uploading) {
      label = escapeHtml(await get_string("designer_attach_uploading", "local_coursegen", item.name));
    }
    item.chip.className = `local_coursegen_attachment_chip${error ? " is-error" : ""}`;
    item.chip.innerHTML = `
      ${item.uploading
        ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
        : `<i class="fa ${error ? "fa-exclamation-triangle" : "fa-paperclip"}" aria-hidden="true"></i>`}
      <span class="chip-name" title="${escapeHtml(error || item.name)}">${label}</span>
      ${error ? `<small>${escapeHtml(error)}</small>` : ""}
      ${item.uploading ? "" : `<button type="button" aria-label="${escapeHtml(removeLabel)}" title="${escapeHtml(removeLabel)}">
        <i class="fa fa-times" aria-hidden="true"></i></button>`}
    `;
    const removeBtn = item.chip.querySelector("button");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => removePending(item));
    }
  };

  const readAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Data URL "data:<mime>;base64,<payload>": keep only the payload.
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const uploadFile = async (file) => {
    const item = {name: file.name, id: null, uploading: true, chip: document.createElement("span")};
    pending.push(item);
    attachmentsRegion.appendChild(item.chip);

    const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
    let error = "";
    if (!ATTACH_EXTENSIONS.includes(extension)) {
      error = await get_string("designer_attach_badtype", "local_coursegen", ATTACH_EXTENSIONS.join(", "));
    } else if (file.size > ATTACH_MAX_BYTES) {
      error = await get_string("designer_attach_toobig", "local_coursegen", "10 MB");
    } else if (!file.size) {
      error = await get_string("designer_attach_empty", "local_coursegen");
    }
    if (error) {
      item.uploading = false;
      await renderChip(item, error);
      updateControls();
      return;
    }

    await renderChip(item);
    updateControls();
    try {
      const response = await designerUpload({
        courseid: params.courseid,
        filename: file.name,
        content: await readAsBase64(file),
      });
      item.uploading = false;
      if (response.success && response.data) {
        item.id = response.data.id;
        item.name = response.data.name;
        await renderChip(item);
      } else {
        await renderChip(item, response.message || await get_string("designer_attach_failed", "local_coursegen"));
      }
    } catch (uploadError) {
      item.uploading = false;
      await renderChip(item, uploadError.message || await get_string("designer_attach_failed", "local_coursegen"));
    }
    updateControls();
  };

  if (attachBtn && attachInput) {
    attachBtn.addEventListener("click", () => attachInput.click());
    attachInput.addEventListener("change", () => {
      Array.from(attachInput.files || []).forEach((file) => {
        void uploadFile(file);
      });
      attachInput.value = ""; // Allow picking the same file again.
    });
  }

  // 3. Wire up the chat form for subsequent messages.
  const submitCurrentMessage = async () => {
    const text = chatInput.value.trim();
    const ready = pending.filter((item) => item.id);
    if (sending || pending.some((item) => item.uploading) || (!text && !ready.length)) {
      return;
    }

    // Add user message. Failed uploads stay out; their chips are cleared too.
    addMessage(messagesContainer, text, "user", ready.map((item) => item.name));
    chatInput.value = "";
    pending.forEach((item) => item.chip.remove());
    pending = [];
    sending = true;
    updateControls();

    // Add AI response placeholder.
    const aiResponseEl = addMessage(messagesContainer, "", "ai");

    // "Thinking..." until the first token (streamResponse keeps it updated).
    const thinkingLabel = await get_string("designer_thinking", "local_coursegen");
    aiResponseEl.innerHTML = `
      <div class="d-flex align-items-center text-muted small" role="status">
        <span class="spinner-grow spinner-grow-sm me-2" aria-hidden="true"></span>${escapeHtml(thinkingLabel)}
      </div>
    `;

    try {
      // Send message to designer.
      const response = await designerMessage({
        courseid: params.courseid,
        text: text,
        attachmentids: ready.map((item) => item.id),
      });

      if (!response.success) {
        aiResponseEl.innerHTML = `<div class="text-danger">${escapeHtml(response.message)}</div>`;
        return;
      }

      // Stream the agent's response.
      const status = await streamResponse(
        response.data.streamingurl,
        aiResponseEl,
        messagesContainer,
        thinkingLabel,
      );

      // Check if the designer has transitioned to a design phase.
      if (status && status.siguiente_agente && status.siguiente_agente !== "human_feedback") {
        await handlePhaseTransition(container, params, status, messagesContainer);
      }

    } catch (error) {
      aiResponseEl.innerHTML = `<div class="text-danger">${escapeHtml(error.message)}</div>`;
    } finally {
      sending = false;
      updateControls();
      chatInput.focus();
      void refreshFiles(container, params.courseid);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitCurrentMessage();
  };

  chatForm.addEventListener("submit", handleSubmit);
  sendBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await submitCurrentMessage();
  });

  // Enter key support (Shift+Enter = newline).
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitCurrentMessage();
    }
  });

  chatInput.focus();
};

/**
 * Handle transition from chat phase to design execution phases.
 * When the orchestrator routes to a specialist agent, show progress
 * and disable the chat input.
 * @param {Element} container - Modal body
 * @param {Object} params - Parameters
 * @param {Object} status - Status from the stream
 * @param {Element} messagesContainer - Messages container
 */
const handlePhaseTransition = async (container, params, status, messagesContainer) => {
  const phaseIndicator = container.querySelector("#designer-phase-indicator");
  const chatInputArea = container.querySelector("#designer-chat-input-area");
  const chatInput = container.querySelector("#designerChatInput");
  const sendBtn = container.querySelector("#designer-send-btn");

  // Show phase indicator.
  if (phaseIndicator) {
    phaseIndicator.style.display = "block";
    const phaseText = container.querySelector("#designer-phase-text");
    if (phaseText) {
      const phaseNames = {
        analista_curricular: "Analizando el currículo...",
        planificador_didactico: "Planificando unidades didácticas...",
        disenador_actividades: "Diseñando actividades...",
        guionista_rise: "Creando guiones RISE...",
        generador_scorm: "Generando paquetes SCORM...",
        calidad: "Revisando calidad...",
        generador_docs: "Generando documentación...",
      };
      phaseText.textContent = phaseNames[status.siguiente_agente] || "Procesando...";
    }
  }

  // If the phase is "end" or design phases completed, offer to create the course.
  if (status.siguiente_agente === "end" || status.fase_actual === "scorm_completada") {
    if (phaseIndicator) {
      phaseIndicator.style.display = "none";
    }

    // Add completion message.
    const completionEl = addMessage(messagesContainer, "", "ai");
    const completionMsg = await get_string("designer_design_complete", "local_coursegen");
    const continueEditingLabel = await get_string("designer_continue_editing", "local_coursegen");
    const acceptLabel = await get_string("accept_planning_create_course", "local_coursegen");
    completionEl.innerHTML = `
      <div class="alert alert-success mb-2">
        <i class="fa fa-check-circle me-2"></i>${escapeHtml(completionMsg)}
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-outline-secondary" data-action="designer-continue-editing">
          <i class="fa fa-pen me-1"></i>${escapeHtml(continueEditingLabel)}
        </button>
        <button type="button" class="btn btn-primary" data-action="designer-accept-plan">
          <i class="fa fa-check me-1"></i>${escapeHtml(acceptLabel)}
        </button>
      </div>
    `;

    const continueBtn = completionEl.querySelector('[data-action="designer-continue-editing"]');
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        if (chatInputArea) {
          chatInputArea.style.display = "";
        }
        if (chatInput) {
          chatInput.disabled = false;
          chatInput.focus();
        }
        if (sendBtn) {
          sendBtn.disabled = false;
        }
        scrollToBottom(messagesContainer);
      });
    }

    // Wire accept button.
    const acceptBtn = completionEl.querySelector('[data-action="designer-accept-plan"]');
    if (acceptBtn) {
      acceptBtn.addEventListener("click", async () => {
        acceptBtn.disabled = true;
        acceptBtn.textContent = await get_string("creating_course", "local_coursegen");

        try {
          const execResponse = await planCourseExecute(params.courseid);
          if (execResponse.success && execResponse.data && execResponse.data.streamingurl) {
            // Add execution container.
            const execDiv = document.createElement("div");
            execDiv.id = "designer-execution-container";
            execDiv.className = "mt-3";
            messagesContainer.appendChild(execDiv);

            const html = await Templates.render("local_coursegen/course_streaming_inline", {
              title: await get_string("course_creating_title", "local_coursegen"),
              subtitle: await get_string("course_creating_subtitle", "local_coursegen"),
            });
            execDiv.innerHTML = html;

            await startExecutionStreaming(
              execResponse.data.streamingurl,
              execDiv.firstElementChild,
              params.courseid,
            );
          }
        } catch (error) {
          Notification.exception(error);
          acceptBtn.disabled = false;
        }
      });
    }

    // Disable chat input when design is complete.
    if (chatInputArea) {
      chatInputArea.style.display = "none";
    }
  }
};
