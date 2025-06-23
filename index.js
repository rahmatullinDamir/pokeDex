const BASE_URL = "https://pokeapi.co/api/v2/pokemon/";
const PAGE_SIZE = 24;
let currentOffset = 0;
let allPokemons = [];
let loadedPokemons = [];
let isLoadingMore = false;
const TYPE_API_URL = 'https://pokeapi.co/api/v2/type/';
const SPECIES_API_URL = 'https://pokeapi.co/api/v2/pokemon-species/';

const fetchPokemonData = async (pokemonIdOrName) => {
    const url = `${BASE_URL}${pokemonIdOrName}/`;
    const response = await fetch(url);
    const result = await response.json();
    const description = await fetchPokemonDescription(result.id);
    return extractPokemonInfo(result, description);
}

const extractPokemonInfo = (data, description = '') => {
    const id = data.id;
    const name = data.name;
    const weight = data.weight/10;
    const height = data.height/10;
    const ability = data.abilities.length > 0
        ? data.abilities[0].ability.name
        : 'No Ability';
    const imageUrl = data.sprites.other['official-artwork'].front_default;
    const types = data.types.map(t => t.type.name);
    const stats = {};
    data.stats.forEach(s => { stats[s.stat.name] = s.base_stat });
    const abilities = data.abilities.map(a => a.ability.name);
    return {
        id,
        name,
        weight,
        height,
        ability,
        imageUrl,
        types,
        stats,
        abilities,
        description
    }
}

const loadFavourites = () => {
    return JSON.parse(localStorage.getItem('favourites')) || [];
};

const toggleFavourite = (id) => {
    let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    const index = favourites.indexOf(id);
    if (index > -1) {
        favourites.splice(index, 1);
    } else {
        favourites.push(id);
    }
    localStorage.setItem('favourites', JSON.stringify(favourites));
    location.reload()
};

const isPokemonFavourite = (id) => {
    const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    return favourites.includes(id);
};

const modalWindow = (pokemon) => {
    const modalWindow = document.querySelector('.pokemon-modal');
    const closeButton = document.querySelector('.close-button');
    const pokemonName = document.querySelector('.modal-title');
    const pokemonImage = document.querySelector('.modal-image');
    const pokemonInfo = document.querySelector('.modal-description');
    const favouriteButton = document.querySelector('.favourite-button');

    modalWindow.style.display = "block";
    pokemonName.textContent = pokemon.name;
    pokemonImage.src = pokemon.imageUrl;
    let typesHtml = pokemon.types.map(t => `<span style='background:#c3a339;color:#fff;padding:2px 10px;border-radius:12px;margin-right:6px;font-size:0.95em;'>${t}</span>`).join(' ');
    let statsHtml = Object.entries(pokemon.stats).map(([k,v]) => `<div><b>${k}:</b> ${v}</div>`).join(' ');
    let abilitiesHtml = pokemon.abilities.map(a => `<span style='background:#eee;color:#222;padding:2px 8px;border-radius:10px;margin-right:4px;font-size:0.95em;'>${a}</span>`).join(' ');
    pokemonInfo.innerHTML = `
        <div style='margin-bottom:10px;'>${pokemon.description ? `<i>${pokemon.description}</i>` : ''}</div>
        <div><b>Number:</b> ${pokemon.id}</div>
        <div><b>Types:</b> ${typesHtml}</div>
        <div><b>Weight:</b> ${pokemon.weight} kg</div>
        <div><b>Height:</b> ${pokemon.height} m</div>
        <div><b>Abilities:</b> ${abilitiesHtml}</div>
        <div style='margin-top:10px;'><b>Stats:</b><div style='display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;'>${statsHtml}</div></div>
    `;

    const isFavourite = isPokemonFavourite(pokemon.id);
    favouriteButton.textContent = isFavourite ? 'Remove from favourites' : 'Add to favourites';
    favouriteButton.dataset.pokemonId = pokemon.id;

    const newFavouriteButton = favouriteButton.cloneNode(true);
    favouriteButton.parentNode.replaceChild(newFavouriteButton, favouriteButton);

    newFavouriteButton.addEventListener('click', () => {
        toggleFavourite(pokemon.id);
        const isFavourite = isPokemonFavourite(pokemon.id);
        newFavouriteButton.textContent = isFavourite ? 'Remove from favourites' : 'Add to favourites';
    });

    closeButton.addEventListener('click', () => {
        modalWindow.style.display = "none";
    })

    window.addEventListener('click', (event) => {
        if (event.target == modalWindow) {
            modalWindow.style.display = "none";
        }
    })
}

const renderCarousel = (activeImageIndex) => {
    const carouselInner = document.querySelector('.carousel-inner');
    const transform = -activeImageIndex * 100;
    carouselInner.style.transform = `translateX(${transform}%)`;

    const indicators = document.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
        if (index === activeImageIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
};

const createPokemonCards = (pokemonArray) => {
    const pokemonContainer = document.querySelector(".pokemon-container");
    const favourites = loadFavourites();

    pokemonContainer.innerHTML = '';

    pokemonArray.forEach(pokemon => {
        const pokemonCard = document.createElement("div");
        pokemonCard.classList.add("pokemon-card");

        const pokemonCardImage = document.createElement("img");
        pokemonCardImage.classList.add("pokemon-image");
        pokemonCardImage.src = pokemon.imageUrl;
        pokemonCardImage.alt = pokemon.name;

        const pokemonCardName = document.createElement("p");
        pokemonCardName.classList.add("pokemon-name");
        pokemonCardName.textContent = pokemon.name;

        if (favourites.includes(pokemon.id)) {
            const favouriteIndicator = document.createElement("span");
            favouriteIndicator.classList.add("favourite-indicator");
            favouriteIndicator.textContent = "⭐";
            pokemonCard.appendChild(favouriteIndicator);
        }

        pokemonCard.appendChild(pokemonCardImage);
        pokemonCard.appendChild(pokemonCardName);
        pokemonContainer.appendChild(pokemonCard);

        pokemonCard.addEventListener("click", (e) => {
            modalWindow(pokemon);
        })
    })
}

const initDOM = (pokemonData) => {
    const carouselInner = document.querySelector('.carousel-inner');
    const carouselIndicators = document.querySelector('.carousel-indicators');
    
    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';

    pokemonData.popularPokemons.forEach((pokemonObj, index) => {
        const carouselItem = document.createElement('div');
        carouselItem.classList.add('carousel-item');

        const img = document.createElement('img');
        img.src = pokemonObj.imageUrl;
        img.alt = pokemonObj.name;

        const info = document.createElement('div');
        info.classList.add('pokemon-info');

        const name = document.createElement('h1');
        name.classList.add('pokemon-name');
        name.textContent = pokemonObj.name;

        const id = document.createElement('p');
        id.textContent = `Number: ${pokemonObj.id}`;

        const ability = document.createElement('p');
        ability.textContent = `Ability: ${pokemonObj.ability}`;

        const weightInfo = document.createElement('p');
        weightInfo.textContent = `Weight: ${pokemonObj.weight}kg`;

        const heightInfo = document.createElement('p');
        heightInfo.textContent = `Height: ${pokemonObj.height}m`;

        info.appendChild(name);
        info.appendChild(id);
        info.appendChild(ability);
        info.appendChild(weightInfo);
        info.appendChild(heightInfo);

        carouselItem.appendChild(img);
        carouselItem.appendChild(info);
        carouselInner.appendChild(carouselItem);

        // Create indicator
        const indicator = document.createElement('div');
        indicator.classList.add('carousel-indicator');
        if (index === pokemonData.imageIndex) {
            indicator.classList.add('active');
        }
        indicator.addEventListener('click', () => {
            pokemonData.imageIndex = index;
            renderCarousel(pokemonData.imageIndex);
        });
        carouselIndicators.appendChild(indicator);
    });

    renderCarousel(pokemonData.imageIndex);
};

const pokemonCarousel = (pokemonData) => {
    const buttonNext = document.querySelector(".carousel-control.next");
    const buttonPrevious = document.querySelector(".carousel-control.prev");

    buttonNext.addEventListener("click", (e) => {
        pokemonData.imageIndex = (pokemonData.imageIndex + 1) % pokemonData.popularPokemons.length;
        renderCarousel(pokemonData.imageIndex);
    });

    buttonPrevious.addEventListener("click", (e) => {
        pokemonData.imageIndex = (pokemonData.imageIndex - 1 + pokemonData.popularPokemons.length) % pokemonData.popularPokemons.length;
        renderCarousel(pokemonData.imageIndex);
    });
}

function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function updateLoadMoreButton() {
    const btn = document.getElementById('load-more');
    if (!btn) return;
    if (loadedPokemons.length < allPokemons.length) {
        btn.style.display = 'inline-block';
    } else {
        btn.style.display = 'none';
    }
}

function renderCurrentPage() {
    createPokemonCards(loadedPokemons);
    updateLoadMoreButton();
}

function loadNextPage() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    showLoader();
    setTimeout(() => {
        const nextPokemons = allPokemons.slice(currentOffset, currentOffset + PAGE_SIZE);
        loadedPokemons = loadedPokemons.concat(nextPokemons);
        currentOffset += PAGE_SIZE;
        renderCurrentPage();
        hideLoader();
        isLoadingMore = false;
    }, 200);
}

const searchPokemons = () => {
    const searchInput = document.querySelector(".search-input");
    const searchButton = document.querySelector(".search-button");
    let allPokemonsLocal = [];

    const performSearch = async () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        showLoader();
        setTimeout(async () => {
            if (searchTerm === '') {
                loadedPokemons = allPokemons.slice(0, currentOffset);
                renderCurrentPage();
                hideLoader();
                return;
            }
            const exact = allPokemons.find(p => p.name.toLowerCase() === searchTerm || p.id.toString() === searchTerm);
            if (exact) {
                hideLoader();
                modalWindow(exact);
                return;
            }
            const filteredPokemons = allPokemons.filter(pokemon => 
                pokemon.name.toLowerCase().includes(searchTerm) ||
                pokemon.id.toString().includes(searchTerm)
            );
            hideLoader();
            if (filteredPokemons.length === 1) {
                modalWindow(filteredPokemons[0]);
            } else if (filteredPokemons.length > 1) {
                loadedPokemons = filteredPokemons;
                renderCurrentPage();
            } else {
                alert('Покемон не найден');
            }
        }, 100);
    };

    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            performSearch();
        }
    });

    return (pokemons) => {
        allPokemonsLocal = pokemons;
    };
}

// Получение списка типов
async function fetchTypes() {
    const res = await fetch(TYPE_API_URL);
    const data = await res.json();
    return data.results.filter(t => t.name !== 'unknown' && t.name !== 'shadow');
}

// Получение описания покемона
async function fetchPokemonDescription(idOrName) {
    try {
        const res = await fetch(`${SPECIES_API_URL}${idOrName}/`);
        const data = await res.json();
        const entry = data.flavor_text_entries.find(e => e.language.name === 'en');
        return entry ? entry.flavor_text.replace(/\f|\n/g, ' ') : '';
    } catch {
        return '';
    }
}

// Фильтрация по типу
let currentType = 'all';
async function updateTypeFilter() {
    const select = document.getElementById('type-filter');
    if (!select) return;
    const types = await fetchTypes();
    select.innerHTML = `<option value="all">Все типы</option>` + types.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    select.value = currentType;
    select.onchange = () => {
        currentType = select.value;
        applyTypeFilter();
    };
}
function applyTypeFilter() {
    let filtered = allPokemons;
    if (currentType !== 'all') {
        filtered = allPokemons.filter(p => p.types.includes(currentType));
    }
    loadedPokemons = filtered.slice(0, currentOffset);
    renderCurrentPage();
}

const pokemonCatalogue = async () => {
    showLoader();
    await updateTypeFilter();
    const popularPokemonIds = [1, 4, 7, 25, 6, 9, 150, 151];
    const popularPokemons = [];
    allPokemons = [];
    loadedPokemons = [];
    currentOffset = 0;

    // Fetch popular pokemons for carousel
    for (const id of popularPokemonIds) {
        try {
            const pokemon = await fetchPokemonData(id);
            popularPokemons.push(pokemon);
        } catch (error) {
            console.error(`Error fetching pokemon ${id}:`, error);
        }
    }

    // Fetch all pokemons for gallery (first 151 pokemons)
    for (let id = 1; id <= 151; id++) {
        try {
            const pokemon = await fetchPokemonData(id);
            allPokemons.push(pokemon);
        } catch (error) {
            console.error(`Error fetching pokemon ${id}:`, error);
        }
    }

    loadedPokemons = allPokemons.slice(0, PAGE_SIZE);
    currentOffset = PAGE_SIZE;

    const pokemonData = {
        popularPokemons,
        allPokemons,
        imageIndex: 0
    };

    initDOM(pokemonData);
    pokemonCarousel(pokemonData);
    renderCurrentPage();
    
    const setAllPokemons = searchPokemons();
    setAllPokemons(allPokemons);
    hideLoader();

    // Кнопка "Загрузить ещё"
    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
        loadMoreBtn.onclick = loadNextPage;
        updateLoadMoreButton();
    }
    // Обновить фильтр типов после загрузки
    await updateTypeFilter();
}

function renderEmptyFavourites() {
    const container = document.querySelector('.pokemon-container');
    container.innerHTML = `<div style="color:#888; text-align:center; font-size:1.3em; padding:40px 0;">У вас нет избранных покемонов <br> <span style='font-size:2em;'>😢</span></div>`;
    updateLoadMoreButton();
}

function getFavouritesList() {
    return JSON.parse(localStorage.getItem('favourites')) || [];
}

function showFavourites() {
    const favourites = getFavouritesList();
    const favPokemons = allPokemons.filter(p => favourites.includes(p.id));
    if (favPokemons.length === 0) {
        renderEmptyFavourites();
    } else {
        createPokemonCards(favPokemons);
        updateLoadMoreButton();
    }
}

function setFavouritesBtnActive(active) {
    const btn = document.getElementById('favourites-btn');
    if (!btn) return;
    if (active) btn.classList.add('active');
    else btn.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    pokemonCatalogue();
    let favouritesMode = false;
    const favBtn = document.getElementById('favourites-btn');
    if (favBtn) {
        favBtn.onclick = () => {
            favouritesMode = !favouritesMode;
            setFavouritesBtnActive(favouritesMode);
            if (favouritesMode) {
                showFavourites();
            } else {
                renderCurrentPage();
            }
        };
    }
});