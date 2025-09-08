let agencies = [];

async function loadData() {
  const response = await fetch(chrome.runtime.getURL("data.json"));
  agencies = await response.json();
  populateDropdown(agencies);
}

function populateDropdown(list) {
  const unitSelect = document.getElementById("unitSelect");
  unitSelect.innerHTML = '<option value="">-- Select an Agency --</option>';

  const grouped = {};
  list.forEach(a => {
    if (!grouped[a.country]) grouped[a.country] = [];
    grouped[a.country].push(a);
  });

  for (const country in grouped) {
    const group = document.createElement("optgroup");
    group.label = country;
    grouped[country].forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.wiki;
      opt.textContent = a.name;
      if (a.official) opt.dataset.official = a.official;
      group.appendChild(opt);
    });
    unitSelect.appendChild(group);
  }

  unitSelect.addEventListener("change", updateSources);
}

function updateSources() {
  const unitSelect = document.getElementById("unitSelect");
  const sourceSelect = document.getElementById("sourceSelect");

  // Reset sources
  sourceSelect.innerHTML = `
    <option value="wiki">Wikipedia</option>
    <option value="youtube">YouTube</option>
    <option value="news">Google News</option>
    <option value="reddit">Reddit r/Intelligence</option>
    <option value="globalsec">GlobalSecurity</option>
  `;

  const selected = unitSelect.options[unitSelect.selectedIndex];
  if (selected && selected.dataset.official) {
    const opt = document.createElement("option");
    opt.value = selected.dataset.official;

    // Extract domain only (e.g., cia.gov from https://www.cia.gov)
    try {
      const url = new URL(selected.dataset.official);
      opt.textContent = url.hostname.replace("www.", ""); 
    } catch {
      opt.textContent = "Official Website";
    }

    sourceSelect.appendChild(opt);
  }
}

function openSource() {
  const searchQuery = document.getElementById("search").value.trim();
  const unitSelect = document.getElementById("unitSelect");
  const sourceSelect = document.getElementById("sourceSelect");
  const source = sourceSelect.value;

  let query = searchQuery;
  let url = "";

  if (!query && unitSelect.value) {
    query = unitSelect.options[unitSelect.selectedIndex].textContent;
    url = unitSelect.value;
  }

  if (!query) {
    alert("Please type in a search or select an agency.");
    return;
  }

  query = encodeURIComponent(query);

  if (source.startsWith("http")) {
    url = source; // direct official link
  } else {
    switch (source) {
      case "wiki": if (!url) url = `https://en.wikipedia.org/wiki/Special:Search?search=${query}`; break;
      case "youtube": url = `https://www.youtube.com/results?search_query=${query}`; break;
      case "news": url = `https://news.google.com/search?q=${query}`; break;
      case "reddit": url = `https://www.reddit.com/r/intelligence/search?q=${query}&restrict_sr=1`; break;
      case "globalsec": url = `https://www.globalsecurity.org/search/?q=${query}`; break;
    }
  }

  chrome.tabs.create({ url });
}

document.getElementById("goBtn").addEventListener("click", openSource);
loadData();
