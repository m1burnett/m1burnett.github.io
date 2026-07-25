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

  function updateHash(id) {
    if (history.pushState) {
      history.pushState(null, "", "#" + id);
    } else {
      window.location.hash = id;
    }
  }

  function getHeadings() {
    var usedIds = {};
    Array.prototype.forEach.call(document.querySelectorAll("[id]"), function(element) {
      usedIds[element.id] = true;
    });

    return Array.prototype.filter.call(
      document.querySelectorAll(".archive h1, .archive h2, .archive h3"),
      function(heading) {
        return !heading.classList.contains("page__title") && heading.textContent.trim().length > 0;
      }
    ).map(function(heading) {
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

      return heading;
    });
  }

  function populateList(list, headings, itemPrefix, afterClick) {
    list.innerHTML = "";

    headings.forEach(function(heading) {
      var level = heading.tagName.toLowerCase();
      var item = document.createElement("li");
      var link = document.createElement("a");

      item.className = itemPrefix + "__item " + itemPrefix + "__item--" + level;
      link.href = "#" + heading.id;
      link.textContent = heading.textContent.trim();
      link.addEventListener("click", function(event) {
        event.preventDefault();
        scrollToHeading(heading);
        updateHash(heading.id);
        if (afterClick) {
          afterClick();
        }
      });

      item.appendChild(link);
      list.appendChild(item);
    });
  }

  ready(function() {
    var sidebarNav = document.querySelector("[data-sidebar-toc]");
    var sidebarList = sidebarNav ? sidebarNav.querySelector(".sidebar-toc__menu") : null;
    var mobileToggle = document.querySelector("[data-mobile-page-toc-toggle]");
    var mobileMenu = document.querySelector("[data-mobile-page-toc-menu]");
    var siteNavButton = document.querySelector("#site-nav > button");
    var siteNavMenu = document.querySelector("#site-nav .hidden-links");

    if (!sidebarList && !mobileMenu) return;

    var headings = getHeadings();

    function closeMobileMenu() {
      if (!mobileMenu || !mobileToggle) return;
      mobileMenu.classList.add("hidden");
      mobileToggle.setAttribute("aria-expanded", "false");
    }

    function closeSiteMenu() {
      if (siteNavMenu) {
        siteNavMenu.classList.add("hidden");
      }

      if (siteNavButton) {
        siteNavButton.classList.remove("close");
      }
    }

    if (!headings.length) {
      if (sidebarNav) {
        sidebarNav.parentNode.removeChild(sidebarNav);
      }

      if (mobileMenu) {
        mobileMenu.parentNode.removeChild(mobileMenu);
      }

      if (mobileToggle && mobileToggle.parentNode) {
        mobileToggle.parentNode.removeChild(mobileToggle);
      }

      return;
    }

    if (sidebarList) {
      populateList(sidebarList, headings, "sidebar-toc");
    }

    if (mobileMenu) {
      populateList(mobileMenu, headings, "mobile-page-toc", closeMobileMenu);
    }

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener("click", function(event) {
        event.preventDefault();
        var isOpen = !mobileMenu.classList.contains("hidden");
        if (!isOpen) {
          closeSiteMenu();
        }
        mobileMenu.classList.toggle("hidden", isOpen);
        mobileToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });

      if (siteNavButton) {
        siteNavButton.addEventListener("click", closeMobileMenu);
      }

      document.addEventListener("click", function(event) {
        if (mobileMenu.classList.contains("hidden")) return;
        if (mobileMenu.contains(event.target) || mobileToggle.contains(event.target)) return;
        closeMobileMenu();
      });

      document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
          closeMobileMenu();
        }
      });
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
