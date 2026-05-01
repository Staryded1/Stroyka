(function () {
    "use strict";

    /** URL API заявок (тот же хост, что и uvicorn по умолчанию) */
    var API_LEADS_URL = "http://127.0.0.1:8000/leads";
    var MODAL_CLOSE_MS = 360;

    var modalEl = null;
    var modalTitleEl = null;
    var modalDescEl = null;
    var modalIconOk = null;
    var modalIconErr = null;
    var modalCloseTimer = null;
    var lastFocusEl = null;
    var escHandler = null;

    function onEscKey(e) {
        if (e.key === "Escape") {
            closeModal();
        }
    }

    function openModal(options) {
        if (!modalEl) return;
        options = options || {};
        var title = options.title != null ? options.title : "Заявка отправлена";
        var subtitle =
            options.subtitle != null
                ? options.subtitle
                : "Мы свяжемся с вами в ближайшее время";
        var variant = options.variant === "error" ? "error" : "success";

        modalTitleEl.textContent = title;
        modalDescEl.textContent = subtitle;
        modalEl.classList.remove("modal--success", "modal--error");
        modalEl.classList.add(variant === "error" ? "modal--error" : "modal--success");

        if (variant === "error") {
            modalIconOk.setAttribute("hidden", "");
            modalIconErr.removeAttribute("hidden");
        } else {
            modalIconErr.setAttribute("hidden", "");
            modalIconOk.removeAttribute("hidden");
        }

        if (modalCloseTimer) {
            clearTimeout(modalCloseTimer);
            modalCloseTimer = null;
        }

        lastFocusEl = document.activeElement;
        modalEl.removeAttribute("hidden");
        modalEl.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-no-scroll");

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                modalEl.classList.add("modal--open");
            });
        });

        if (escHandler) {
            document.removeEventListener("keydown", escHandler);
        }
        escHandler = onEscKey;
        document.addEventListener("keydown", escHandler);

        var btn = modalEl.querySelector(".modal__btn");
        if (btn) {
            btn.focus();
        }
    }

    function closeModal() {
        if (!modalEl || !modalEl.classList.contains("modal--open")) return;

        modalEl.classList.remove("modal--open");
        document.body.classList.remove("modal-no-scroll");

        if (escHandler) {
            document.removeEventListener("keydown", escHandler);
            escHandler = null;
        }

        if (modalCloseTimer) {
            clearTimeout(modalCloseTimer);
        }
        modalCloseTimer = setTimeout(function () {
            modalEl.setAttribute("hidden", "");
            modalEl.setAttribute("aria-hidden", "true");
            modalCloseTimer = null;
            if (lastFocusEl && typeof lastFocusEl.focus === "function") {
                lastFocusEl.focus();
            }
            lastFocusEl = null;
        }, MODAL_CLOSE_MS);
    }

    function initLeadModal() {
        modalEl = document.getElementById("lead-modal");
        if (!modalEl) return;
        modalTitleEl = document.getElementById("lead-modal-title");
        modalDescEl = document.getElementById("lead-modal-desc");
        modalIconOk = modalEl.querySelector(".modal__icon--success");
        modalIconErr = modalEl.querySelector(".modal__icon--error");

        modalEl.querySelectorAll(".js-modal-close").forEach(function (node) {
            node.addEventListener("click", function (e) {
                e.preventDefault();
                closeModal();
            });
        });
    }

    function initNav() {
        var toggle = document.querySelector(".nav-toggle");
        var nav = document.querySelector(".nav");
        if (!toggle || !nav) return;

        toggle.addEventListener("click", function () {
            var open = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });

        nav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                if (window.matchMedia("(max-width: 900px)").matches) {
                    nav.classList.remove("is-open");
                    toggle.setAttribute("aria-expanded", "false");
                }
            });
        });
    }

    function scrollToForm(target) {
        var el = typeof target === "string" ? document.querySelector(target) : target;
        if (!el) return;
        var top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: top, behavior: "smooth" });
    }

    function initScrollFormLinks() {
        document.querySelectorAll(".js-scroll-form").forEach(function (anchor) {
            anchor.addEventListener("click", function (e) {
                var href = anchor.getAttribute("href");
                if (!href || href.indexOf("#") === -1) return;
                var hash = href.split("#")[1];
                if (!hash) return;
                var local = document.getElementById(hash);
                if (local) {
                    e.preventDefault();
                    scrollToForm(local);
                }
            });
        });
    }

    function formatServerError(detail, status) {
        var msg = "Ошибка сервера (" + status + "). Попробуйте позже.";
        if (typeof detail === "string") {
            return detail;
        }
        if (Array.isArray(detail)) {
            var parts = detail
                .map(function (x) {
                    return (x.msg || x.type || "") + "";
                })
                .filter(Boolean);
            if (parts.length) {
                return parts.join(" ");
            }
        }
        return msg;
    }

    function initForms() {
        document.querySelectorAll(".js-lead-form").forEach(function (form) {
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                var name = form.querySelector('[name="name"]');
                var phone = form.querySelector('[name="phone"]');
                var submitBtn = form.querySelector('button[type="submit"]');
                var n = name && name.value.trim();
                var p = phone && phone.value.trim();
                if (!n || !p) {
                    openModal({
                        variant: "error",
                        title: "Заполните поля",
                        subtitle: "Укажите имя и телефон, чтобы мы могли с вами связаться.",
                    });
                    return;
                }
                if (submitBtn) {
                    submitBtn.disabled = true;
                }
                fetch(API_LEADS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: n, phone: p }),
                })
                    .then(function (res) {
                        return res.json().then(
                            function (data) {
                                return { ok: res.ok, status: res.status, data: data };
                            },
                            function () {
                                return { ok: res.ok, status: res.status, data: null };
                            }
                        );
                    })
                    .then(function (result) {
                        if (result.ok) {
                            openModal({
                                variant: "success",
                                title: "Заявка отправлена",
                                subtitle: "Мы свяжемся с вами в ближайшее время",
                            });
                            form.reset();
                        } else {
                            openModal({
                                variant: "error",
                                title: "Не удалось отправить",
                                subtitle: formatServerError(
                                    result.data && result.data.detail,
                                    result.status
                                ),
                            });
                        }
                    })
                    .catch(function () {
                        openModal({
                            variant: "error",
                            title: "Нет соединения",
                            subtitle:
                                "Проверьте, что сервер запущен (uvicorn), и адрес API в коде указан верно.",
                        });
                    })
                    .finally(function () {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                        }
                    });
            });
        });
    }

    function initGallery() {
        document.querySelectorAll(".gallery__item").forEach(function (item) {
            item.addEventListener("click", function (e) {
                e.preventDefault();
                var cap = item.getAttribute("data-caption") || "Объект в портфолио";
                openModal({
                    variant: "success",
                    title: cap,
                    subtitle: "Расширенная галерея появится после доработки раздела.",
                });
            });
        });
    }

    function initReveal() {
        var nodes = document.querySelectorAll(".reveal");
        if (!nodes.length) return;
        if (
            window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
            !("IntersectionObserver" in window)
        ) {
            nodes.forEach(function (n) {
                n.classList.add("is-visible");
            });
            return;
        }
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        io.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: "0px 0px -40px 0px", threshold: 0.08 }
        );
        nodes.forEach(function (n) {
            io.observe(n);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initLeadModal();
        initNav();
        initScrollFormLinks();
        initForms();
        initGallery();
        initReveal();
    });
})();
