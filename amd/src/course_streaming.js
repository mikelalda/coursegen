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
 * Course Streaming Module for handling real-time course generation
 *
 * @module     local_coursegen/course_streaming
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { createCourse } from "local_coursegen/repository/chatbot";
import { get_string } from "core/str";

// Global state for scroll behavior
let userHasScrolled = false;
let scrollTimeout = null;

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

  return normalized.includes("local-coursegen-plan") || /<(section|article|div|p|ul|ol|li|h[1-6]|table|thead|tbody|tr|td|th|blockquote|pre)\b/i.test(normalized);
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
 * Render markdown into safe HTML for chat and streaming content.
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
      html.push(
        `<table><thead><tr>${headers.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`
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
 * Check if user is at the bottom of the scrollable container
 * @param {Element} element - The scrollable element
 * @returns {boolean} - True if user is at bottom
 */
const isAtBottom = (element) => {
  const threshold = 50; // 50px threshold
  return (
    element.scrollTop + element.clientHeight >= element.scrollHeight - threshold
  );
};

/**
 * Setup scroll detection to pause auto-scroll when user scrolls manually
 * @param {Element} scrollContainer - The container to monitor for scroll
 */
const setupScrollDetection = (scrollContainer) => {
  if (!scrollContainer) {
    return;
  }

  const handleScroll = () => {
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Mark that user has scrolled
    userHasScrolled = true;

    // Check if user scrolled back to bottom
    if (isAtBottom(scrollContainer)) {
      // Reset flag after a short delay to resume auto-scroll
      scrollTimeout = setTimeout(() => {
        userHasScrolled = false;
      }, 1000);
    }
  };

  scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
};

/**
 * Start course streaming from the provided URL
 * @param {string} streamingUrl - The EventSource URL for streaming
 * @param {Element} container - Container element for displaying results
 * @param {boolean} isCorrection - Whether this is a plan correction (don't clear existing content)
 * @returns {Promise} Promise that resolves when streaming is complete
 */
export const startStreaming = async (
  streamingUrl,
  container,
  isCorrection = false
) => {
  const progressIndicator = container.querySelector(
    "[data-region='local_coursegen/course_streaming/progress']"
  );
  const eventList = container.querySelector(
    "[data-region='local_coursegen/course_streaming']"
  );
  const progressIcon = container.querySelector(
    "[data-region='local_coursegen/course_streaming/progress/icon']"
  );

  // Create local buffer and RAF state for this streaming instance
  let htmlBuffer = "";
  let rafPending = false;

  // Only clear content if this is not a correction
  if (!isCorrection) {
    eventList.innerHTML = "";
  }
  if (progressIndicator) {
    progressIndicator.style.display = "block";
  }

  // Reset scroll state for new streaming session
  userHasScrolled = false;
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }

  // Setup scroll detection on modal body
  const modalBody = document.querySelector(".modal-body");
  if (modalBody) {
    setupScrollDetection(modalBody);
  }

  // Disable both planning buttons during streaming
  const acceptBtn = document.getElementById("accept-planning-btn");
  const adjustBtn = document.getElementById("adjust-planning-btn");
  if (acceptBtn) {
    acceptBtn.disabled = true;
  }
  if (adjustBtn) {
    adjustBtn.disabled = true;
  }

  // Local functions for this streaming instance
  const updateHtmlSoon = (container) => {
    if (rafPending) {
      return;
    }
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      container.innerHTML = renderAssistantContent(htmlBuffer);
      // Only auto-scroll if user hasn't manually scrolled
      if (!userHasScrolled) {
        const modalBody = document.querySelector(".modal-body");
        if (modalBody) {
          modalBody.scrollTop = modalBody.scrollHeight;
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }
    });
  };

  const appendToken = (token, container) => {
    htmlBuffer += token;
    updateHtmlSoon(container);
  };

  const evtSource = new EventSource(streamingUrl);

  evtSource.addEventListener("assistant_token", (event) => {
    appendToken(event.data, eventList);
  });

  evtSource.addEventListener("assistant_message_end", () => {
    progressIcon.innerHTML = `
        <div class="bg-success rounded-circle d-flex align-items-center justify-content-center"
              style="width: 1.5rem; height: 1.5rem;">
          <i class="text-white" style="font-size: 0.8rem;">✓</i>
        </div>
      `;
    const planningActions = document.getElementById("course-planning-actions");
    if (planningActions) {
      planningActions.style.display = "block";
    }

    // Re-enable both planning buttons after streaming completes
    const acceptBtn = document.getElementById("accept-planning-btn");
    const adjustBtn = document.getElementById("adjust-planning-btn");
    if (acceptBtn) {
      acceptBtn.disabled = false;
    }
    if (adjustBtn) {
      adjustBtn.disabled = false;
    }

    evtSource.close();
  });
};

/**
 * Helper to parse backend dict-like payloads
 * @param {string} raw - Raw data from event
 * @returns {Object|null} Parsed object or null
 */
const parseBest = (raw) => {
  if (!raw) {
    return null;
  }
  const s = String(raw).trim();
  try {
    return JSON.parse(s);
  } catch (_) {}
  try {
    // Best-effort convert Python dict repr to JSON
    let t = s
      .replace(/'/g, '"')
      .replace(/\bNone\b/g, "null")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false");
    return JSON.parse(t);
  } catch (_) {
    return null;
  }
};

/**
 * Add status message to the execution container with proper scrolling
 * @param {string} message - Status message
 * @param {string} type - Status type (info, ok, error)
 * @param {Element} container - Container element
 */
const addStatus = (message, type, container) => {
  const statusDiv = document.createElement("div");
  const alertClassMap = {
    success: "success",
    error: "danger",
    info: "info"
  };

  statusDiv.className = `alert alert-${alertClassMap[type] || "info"} mb-2`;
  statusDiv.innerHTML = `<small>${message}</small>`;
  container.appendChild(statusDiv);

  // Only auto-scroll if user hasn't manually scrolled
  if (!userHasScrolled) {
    const modalBody = document.querySelector(".modal-body");
    if (modalBody) {
      modalBody.scrollTop = modalBody.scrollHeight;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }
};

/**
 * Start execution streaming from the provided URL
 * @param {string} streamingUrl - The EventSource URL for streaming
 * @param {Element} container - Container element for displaying results
 * @param {number} courseid - The course ID for creating the course
 * @returns {Promise} Promise that resolves when streaming is complete
 */
export const startExecutionStreaming = async (
  streamingUrl,
  container,
  courseid
) => {
  const progressIndicator = container.querySelector(
    "[data-region='local_coursegen/course_streaming/progress']"
  );
  const eventList = container.querySelector(
    "[data-region='local_coursegen/course_streaming']"
  );
  const progressIcon = container.querySelector(
    "[data-region='local_coursegen/course_streaming/progress/icon']"
  );

  eventList.innerHTML = "";
  if (progressIndicator) {
    progressIndicator.style.display = "block";
  }

  // Reset scroll state for execution streaming
  userHasScrolled = false;
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }

  // Setup scroll detection on modal body
  const modalBody = document.querySelector(".modal-body");
  if (modalBody) {
    setupScrollDetection(modalBody);
  }

  const es = new EventSource(streamingUrl);

  const onActStart = async (e) => {
    const obj = parseBest(e.data) || {};
    const idx = obj.index ?? "?";
    const title = obj.title || "";
    const sec = obj.section_index ?? "?";
    const msg = await get_string(
      "execution_activity_start",
      "local_coursegen",
      {
        index: idx,
        section: sec,
        title: title,
      }
    );
    addStatus(msg, "info", eventList);
  };

  const onActDone = async (e) => {
    const obj = parseBest(e.data) || {};
    const done = obj.done ?? 0;
    const total = obj.total ?? 0;
    const percent = obj.percent ?? 0;
    const msg = await get_string("execution_activity_done", "local_coursegen", {
      done,
      total,
      percent,
    });
    addStatus(msg, "ok", eventList);
  };

  const onProgress = async (e) => {
    const obj = parseBest(e.data) || {};
    const done = obj.done ?? 0;
    const total = obj.total ?? 0;
    const percent = obj.percent ?? 0;
    const msg = await get_string("execution_progress", "local_coursegen", {
      done,
      total,
      percent,
    });
    addStatus(msg, "info", eventList);
  };

  const onExecError = async () => {
    const msg = await get_string("execution_error_activity", "local_coursegen");
    addStatus(msg, "error", eventList);
  };

  const onComplete = async () => {
    // Close the EventSource connection first
    es.close();
    progressIcon.innerHTML = `
        <div class="bg-success rounded-circle d-flex align-items-center justify-content-center"
              style="width: 1.5rem; height: 1.5rem;">
          <i class="text-white" style="font-size: 0.8rem;">✓</i>
        </div>
      `;

    // Call createCourse to apply the AI-generated content
    try {
      const result = await createCourse({ courseid });

      if (result.success) {
        const okmsg = await get_string(
          "course_created_success_simple",
          "local_coursegen"
        );
        addStatus(okmsg, "ok", eventList);
        // Reload the page after 500ms
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const errmsg = await get_string(
          "error_creating_course",
          "local_coursegen",
          result.message || ""
        );
        addStatus(errmsg, "error", eventList);
      }
    } catch (error) {
      const errmsg = await get_string(
        "error_creating_course",
        "local_coursegen",
        error.message || ""
      );
      addStatus(errmsg, "error", eventList);
    }
  };

  // Register event listeners
  es.addEventListener("execution_activity_start", onActStart);
  es.addEventListener("execution_activity_done", onActDone);
  es.addEventListener("execution_progress", onProgress);
  es.addEventListener("execution_error", onExecError);
  es.addEventListener("execution_complete", onComplete);
};
