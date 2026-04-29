(function () {
  "use strict";

  var BASE_URL = "https://headless-feedback.vercel.app";
  var VOTER_KEY = "hf_voter_id";

  function getVoterId() {
    var id = localStorage.getItem(VOTER_KEY);
    if (!id) {
      id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(VOTER_KEY, id);
    }
    return id;
  }

  function apiFetch(path, opts) {
    return fetch(BASE_URL + path, opts);
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.assign(node, attrs || {});
    (children || []).forEach(function (c) {
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  }

  function renderFeedback(item, accountId) {
    var voterId = getVoterId();
    var upvoteBtn = el("button", {
      className: "hf-upvote",
      textContent: "▲ " + item.upvotes,
    });
    upvoteBtn.addEventListener("click", function () {
      apiFetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: item.id, voterId: voterId }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var count = parseInt(upvoteBtn.textContent.replace("▲ ", ""), 10);
          upvoteBtn.textContent = "▲ " + (data.upvoted ? count + 1 : count - 1);
        });
    });

    return el("div", { className: "hf-item" }, [
      el("p", { className: "hf-content", textContent: item.content }),
      upvoteBtn,
    ]);
  }

  function mount(container, accountId) {
    container.innerHTML = "";
    container.className = "hf-widget";

    var style = document.createElement("style");
    style.textContent = [
      ".hf-widget{font-family:system-ui,sans-serif;max-width:480px;padding:16px}",
      ".hf-textarea{width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;min-height:72px}",
      ".hf-submit{margin-top:8px;padding:8px 16px;background:#000;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px}",
      ".hf-submit:hover{background:#333}",
      ".hf-list{margin-top:16px;display:flex;flex-direction:column;gap:8px}",
      ".hf-item{border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px}",
      ".hf-content{margin:0;font-size:14px;color:#111;flex:1}",
      ".hf-upvote{background:none;border:1px solid #e5e7eb;border-radius:4px;cursor:pointer;font-size:12px;padding:2px 8px;color:#555}",
      ".hf-upvote:hover{background:#f3f4f6}",
      ".hf-error{color:#dc2626;font-size:13px;margin-top:4px}",
    ].join("");
    document.head.appendChild(style);

    var textarea = el("textarea", {
      className: "hf-textarea",
      placeholder: "Share your feedback…",
    });
    var error = el("p", { className: "hf-error", textContent: "" });
    error.style.display = "none";

    var submit = el("button", { className: "hf-submit", textContent: "Send feedback" });
    var list = el("div", { className: "hf-list" });

    submit.addEventListener("click", function () {
      var content = textarea.value.trim();
      if (content.length < 4) {
        error.textContent = "Feedback must be at least 4 characters.";
        error.style.display = "block";
        return;
      }
      error.style.display = "none";
      submit.disabled = true;
      apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: accountId, content: content }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          textarea.value = "";
          submit.disabled = false;
          if (data.id) {
            data.upvotes = 0;
            list.insertBefore(renderFeedback(data, accountId), list.firstChild);
          }
        })
        .catch(function () {
          submit.disabled = false;
          error.textContent = "Failed to submit. Try again.";
          error.style.display = "block";
        });
    });

    container.appendChild(textarea);
    container.appendChild(error);
    container.appendChild(submit);
    container.appendChild(list);

    apiFetch("/api/feedback?accountId=" + encodeURIComponent(accountId))
      .then(function (r) { return r.json(); })
      .then(function (items) {
        items.forEach(function (item) {
          list.appendChild(renderFeedback(item, accountId));
        });
      });
  }

  function init() {
    var scripts = document.querySelectorAll("script[data-account]");
    var script = scripts[scripts.length - 1];
    var accountId = script && script.getAttribute("data-account");
    if (!accountId) return;

    var container = document.getElementById("hf-feedback");
    if (!container) return;

    mount(container, accountId);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
