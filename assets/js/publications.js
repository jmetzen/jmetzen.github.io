document.addEventListener('DOMContentLoaded', () => {
  const publications = document.querySelector('.publications');
  const search = document.querySelector('#publication-search');
  const clear = document.querySelector('#publication-search-clear');
  const yearNav = document.querySelector('.publication-year-nav');
  const results = document.querySelector('#publication-results');

  if (!publications || !search || !clear || !yearNav || !results) return;

  const groups = Array.from(publications.querySelectorAll('h2.bibliography')).map((heading) => {
    const list = heading.nextElementSibling;
    const year = heading.textContent.trim();

    if (!list || !list.matches('ol.bibliography')) return null;

    heading.id = `year-${year}`;
    return {
      heading,
      list,
      entries: Array.from(list.children).filter((entry) => entry.matches('li')),
      year,
    };
  }).filter(Boolean);

  const total = groups.reduce((count, group) => count + group.entries.length, 0);

  groups.forEach((group) => {
    const link = document.createElement('a');
    link.href = `#${group.heading.id}`;
    link.textContent = group.year;
    yearNav.appendChild(link);
  });

  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;

    groups.forEach((group) => {
      let visibleInGroup = 0;

      group.entries.forEach((entry) => {
        const matches = !query || entry.textContent.toLocaleLowerCase().includes(query);
        entry.hidden = !matches;
        if (matches) visibleInGroup += 1;
      });

      const hideGroup = visibleInGroup === 0;
      group.heading.hidden = hideGroup;
      group.list.hidden = hideGroup;
      visible += visibleInGroup;
    });

    clear.hidden = query.length === 0;
    results.textContent = query
      ? `${visible} of ${total} publications shown`
      : `${total} publications`;
  };

  search.addEventListener('input', update);
  clear.addEventListener('click', () => {
    search.value = '';
    update();
    search.focus();
  });

  update();
});
