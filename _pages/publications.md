---
layout: page
permalink: /publications/
title: Publications
description: Browse publications by year or search by title, author, and topic.
nav: true
nav_order: 1
---
<!-- _pages/publications.md -->
<p>
  <a href="https://scholar.google.com/citations?user={{ site.scholar_userid }}">
    View my Google Scholar profile <span aria-hidden="true">↗</span>
  </a>
</p>

<div class="publication-tools" aria-label="Publication filters">
  <label for="publication-search">Search publications</label>
  <div class="publication-search-row">
    <input
      id="publication-search"
      type="search"
      placeholder="Search by title, author, or topic"
      autocomplete="off"
      aria-describedby="publication-results"
    >
    <button id="publication-search-clear" class="btn" type="button" hidden>Clear</button>
  </div>
  <div class="publication-year-nav" aria-label="Jump to publication year"></div>
  <p id="publication-results" class="publication-results" aria-live="polite"></p>
</div>

<div class="publications">

{% bibliography -f {{ site.scholar.bibliography }} %}

</div>

<script defer src="{{ '/assets/js/publications.js' | relative_url }}"></script>
