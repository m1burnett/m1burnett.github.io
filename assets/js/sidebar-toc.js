(function() {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function slugify(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function getScrollOffset() {
    var masthead = document.querySelector(".masthead");
    var mastheadHeight = masthead ? masthead.offsetHeight : 0;
    return mastheadHeight + 18;
  }

  function scrollToHeading(heading) {
    var targetTop = heading.getBoundingClientRect().top + window.pageYOffset - getScrollOffset();
    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });
  }

  ready(function() {
    var nav = document.querySelector("[data-sidebar-toc]");
    if (!nav) return;

    var list = nav.querySelector(".sidebar-toc__menu");
    var usedIds = {};
    Array.prototype.forEach.call(document.querySelectorAll("[id]"), function(element) {
      usedIds[element.id] = true;
    });

    var headings = Array.prototype.filter.call(
      document.querySelectorAll(".archive h1, .archive h2, .archive h3"),
      function(heading) {
        return !heading.classList.contains("page__title") && heading.textContent.trim().length > 0;
      }
    );

    headings.forEach(function(heading) {
      if (!heading.id) {
        var baseId = slugify(heading.textContent) || "section";
        var id = baseId;
        var index = 2;

        while (usedIds[id]) {
          id = baseId + "-" + index;
          index += 1;
        }

        heading.id = id;
        usedIds[id] = true;
      }

      var level = heading.tagName.toLowerCase();
      var item = document.createElement("li");
      var link = document.createElement("a");

      item.className = "sidebar-toc__item sidebar-toc__item--" + level;
      link.href = "#" + heading.id;
      link.textContent = heading.textContent.trim();
      link.addEventListener("click", function(event) {
        event.preventDefault();
        scrollToHeading(heading);
        if (history.pushState) {
          history.pushState(null, "", "#" + heading.id);
        } else {
          window.location.hash = heading.id;
        }
      });

      item.appendChild(link);
      list.appendChild(item);
    });

    if (!list.children.length) {
      nav.parentNode.removeChild(nav);
      return;
    }

    if (window.location.hash) {
      var initialHeading = document.getElementById(window.location.hash.slice(1));
      if (initialHeading) {
        window.setTimeout(function() {
          scrollToHeading(initialHeading);
        }, 0);
      }
    }
  });
})();
