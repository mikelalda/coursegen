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
  planCourseExecute,
} from "local_coursegen/repository/chatbot";
import {
  startExecutionStreaming,
} from "local_coursegen/course_streaming";

let currentModal = null;
let userHasScrolled = false;

/**
 * Scroll the chat messages area to the bottom.
 * @param {Element} container - The messages container
 */
const scrollToBottom = (container) => {
  if (!userHasScrolled) {
    const modalBody = container.closest(".modal-body");
    if (modalBody) {
      modalBody.scrollTop = modalBody.scrollHeight;
    }
  }
};

/**
 * Add a message bubble to the chat.
 * @param {Element} messagesContainer - Messages container element
 * @param {string} content - Message content (HTML supported for AI)
 * @param {string} role - 'user' or 'ai'
 * @returns {Element} The response content element (for AI messages)
 */
const addMessage = (messagesContainer, content, role) => {
  const msgDiv = document.createElement("div");
  msgDiv.className = `local_coursegen_ai_msg ${role} mb-3`;

  if (role === "user") {
    msgDiv.innerHTML = `
      <div class="d-flex justify-content-end">
        <div class="bubble bg-primary text-white rounded p-3" style="max-width: 80%;">
          ${renderMarkdown(content)}
        </div>
      </div>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom(messagesContainer);
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
 * @param {string} streamingUrl - SSE endpoint URL
 * @param {Element} targetElement - Element to render tokens into
 * @param {Element} messagesContainer - Messages container for scrolling
 * @returns {Promise<Object>} Resolves with status data when complete
 */
const streamResponse = (streamingUrl, targetElement, messagesContainer) => {
  return new Promise((resolve, reject) => {
    let htmlBuffer = "";
    let rafPending = false;
    let lastStatus = null;

    const updateHtml = () => {
      if (rafPending) {
        return;
      }
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        targetElement.innerHTML = renderAssistantContent(htmlBuffer);
        scrollToBottom(messagesContainer);
      });
    };

    const evtSource = new EventSource(streamingUrl);

    evtSource.addEventListener("assistant_token", (event) => {
      htmlBuffer += event.data;
      updateHtml();
    });

    evtSource.addEventListener("designer_status", (event) => {
      try {
        lastStatus = JSON.parse(event.data);
      } catch (_) {
        // Ignore parse errors.
      }
    });

    evtSource.addEventListener("assistant_message_end", () => {
      // Final render
      targetElement.innerHTML = renderAssistantContent(htmlBuffer);
      scrollToBottom(messagesContainer);
      evtSource.close();
      resolve(lastStatus || {});
    });

    evtSource.addEventListener("error", (event) => {
      if (event.data) {
        targetElement.innerHTML += `<div class="text-danger mt-2"><small>${escapeHtml(event.data)}</small></div>`;
      }
      evtSource.close();
      reject(new Error(event.data || "Stream error"));
    });

    evtSource.onerror = () => {
      // EventSource connection error — treat as end
      evtSource.close();
      if (htmlBuffer) {
        targetElement.innerHTML = renderAssistantContent(htmlBuffer);
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
    userHasScrolled = false;

    // Setup scroll detection.
    const modalBody = currentModal.getBody()[0].closest(".modal-body") || currentModal.getBody()[0];
    modalBody.addEventListener("scroll", () => {
      userHasScrolled = true;
      const threshold = 50;
      if (modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - threshold) {
        setTimeout(() => {
          userHasScrolled = false;
        }, 1000);
      }
    }, { passive: true });

    // Start the designer session.
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

  // 1. Start the designer session via AJAX.
  let sessionData;
  try {
    const result = await designerStart({ courseid: params.courseid });
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

  // 2. Stream the initial greeting from the orchestrator.
  if (!sessionData || !sessionData.streamingurl) {
    initialResponse.innerHTML = `<div class="text-danger">Error: no se recibió URL de streaming</div>`;
    return;
  }

  try {
    await streamResponse(sessionData.streamingurl, initialResponse, messagesContainer);
  } catch (error) {
    const errMsg = error.message || 'Se perdió la conexión con el diseñador';
    initialResponse.innerHTML = `<div class="text-danger mt-2">${escapeHtml(errMsg)}</div>`;
  }

  // 3. Wire up the chat form for subsequent messages.
  const submitCurrentMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) {
      return;
    }

    // Add user message.
    addMessage(messagesContainer, text, "user");
    chatInput.value = "";
    sendBtn.disabled = true;
    chatInput.disabled = true;

    // Add AI response placeholder.
    const aiResponseEl = addMessage(messagesContainer, "", "ai");

    // Show loading spinner.
    aiResponseEl.innerHTML = `
      <div class="d-flex align-items-center text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        <small>Pensando...</small>
      </div>
    `;

    try {
      // Send message to designer.
      const response = await designerMessage({
        courseid: params.courseid,
        text: text,
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
      );

      // Check if the designer has transitioned to a design phase.
      if (status && status.siguiente_agente && status.siguiente_agente !== "human_feedback") {
        await handlePhaseTransition(container, params, status, messagesContainer);
      }

    } catch (error) {
      aiResponseEl.innerHTML = `<div class="text-danger">${escapeHtml(error.message)}</div>`;
    } finally {
      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
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
