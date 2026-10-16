/* SPDX-License-Identifier: BSD-3-Clause */
/* SPDX-FileCopyrightText: Copyright (c) Jeff C. Jensen */

(function () {
    "use strict";

    const win = document.getElementById("window");
    const pre = win.querySelector("pre");
    const code = pre.querySelector("code");
    const echo = document.getElementById("echo");
    const bufferName = document.getElementById("ml-buffer").textContent;
    const modeLinePos = document.getElementById("ml-pos");
    const modeLineLine = document.getElementById("ml-line");

    // the cursor rests on the first character of the buffer, or at end of buffer if it is empty
    function placeCursor() {
        const cursor = document.createElement("span");
        cursor.className = "cursor";
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => (node.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
        });
        const text = walker.nextNode();
        if (text) {
            text.splitText(1);
            text.replaceWith(cursor);
            cursor.appendChild(text);
        } else {
            cursor.textContent = " ";
            code.appendChild(cursor);
        }
        return cursor;
    }

    // 1-based line number containing the cursor
    function cursorLine(cursor) {
        const range = document.createRange();
        range.setStart(code, 0);
        range.setEndBefore(cursor);
        return range.toString().split("\n").length;
    }

    // mode-line scroll indicator; the 1px slack absorbs fractional scrollTop at the bottom
    function updatePosition() {
        const maxScroll = win.scrollHeight - win.clientHeight;
        if (maxScroll <= 0) {
            modeLinePos.textContent = "All";
        } else if (win.scrollTop <= 0) {
            modeLinePos.textContent = "Top";
        } else if (win.scrollTop >= maxScroll - 1) {
            modeLinePos.textContent = "Bot";
        } else {
            modeLinePos.textContent = `${Math.round((win.scrollTop / maxScroll) * 100)}%`;
        }
    }

    function message(text) {
        echo.textContent = text;
    }

    Prism.hooks.add("complete", (env) => {
        if (env.element !== code) {
            return;
        }
        const line = cursorLine(placeCursor());
        modeLineLine.textContent = String(line);
        Prism.plugins.lineNumbers.getLine(pre, line).classList.add("current");
        updatePosition();
    });

    // sized before highlighting so wrapped line heights are measured at the final width
    const lineCount = code.textContent.split("\n").length;
    pre.style.setProperty("--gutter", `${String(lineCount).length + 1}ch`);

    document.getElementById("ml-fill").textContent = "-".repeat(512);
    win.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    document.addEventListener("keydown", (event) => {
        if (event.metaKey || event.altKey) {
            return;
        }
        if (event.ctrlKey) {
            if (event.key === "g") {
                event.preventDefault();
                message("Quit");
            }
            return;
        }
        // a single-character key name is a printable character
        if (event.key.length === 1 || event.key === "Enter" || event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            message(`Buffer is read-only: #<buffer ${bufferName}>`);
        }
    });

    win.focus({ preventScroll: true });
})();
