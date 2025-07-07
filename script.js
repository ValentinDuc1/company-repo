document.addEventListener('DOMContentLoaded', () => {
    // Element selectors
    const companyList = document.getElementById('company-list');
    const searchNameInput = document.getElementById('search-name');
    const filterSectorSelect = document.getElementById('filter-sector');
    const filterLocationSelect = document.getElementById('filter-location');
    const noResultsDiv = document.getElementById('no-results');
    const totalCompaniesEl = document.getElementById('total-companies');
    const averageRevenueEl = document.getElementById('average-revenue');
    const companiesPerCountryEl = document.getElementById('companies-per-country');
    const statsSection = document.getElementById('stats-section');

    let companies = [];

    // Fetch data from the JSON file
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Ensure data is a valid array before proceeding
            if (!Array.isArray(data)) {
                 throw new Error("Fetched data is not an array.");
            }
            companies = data;
            populateFilters(companies);
            // Perform the initial render now that data is ready
            filterAndRender(); 
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            companyList.innerHTML = `<p class="text-red-500 text-center col-span-full">Error loading company data. Please check the console.</p>`;
            // Hide stats on error
            if(statsSection) statsSection.classList.add('hidden');
        });

    /**
     * Parses a revenue string (e.g., "$10M to $50M") and returns an average value.
     * @param {string} revenueString - The revenue string to parse.
     * @returns {number|null} The average revenue in millions, or null if parsing fails.
     */
    function parseRevenue(revenueString) {
        if (!revenueString || typeof revenueString !== 'string') return null;

        const cleanedString = revenueString.replace(/\$|M/g, '');
        const parts = cleanedString.split(/ to |-/).map(part => parseFloat(part.trim()));

        if (parts.some(isNaN)) return null;

        if (parts.length === 2) {
            return (parts[0] + parts[1]) / 2;
        } else if (parts.length === 1) {
            return parts[0];
        }
        return null;
    }

    /**
     * Calculates and updates the dynamic statistics cards.
     * @param {Array<Object>} data - The array of company objects to calculate stats for.
     */
    function updateStats(data) {
        totalCompaniesEl.textContent = data.length;

        let totalRevenue = 0;
        let companiesWithRevenue = 0;
        data.forEach(company => {
            const avgRevenue = parseRevenue(company.revenue);
            if (avgRevenue !== null) {
                totalRevenue += avgRevenue;
                companiesWithRevenue++;
            }
        });
        const averageRevenue = companiesWithRevenue > 0 ? (totalRevenue / companiesWithRevenue) : 0;
        averageRevenueEl.textContent = `$${averageRevenue.toFixed(1)}M`;

        const countryCounts = data.reduce((acc, company) => {
            const country = company.location.split(', ').pop();
            acc[country] = (acc[country] || 0) + 1;
            return acc;
        }, {});

        companiesPerCountryEl.innerHTML = '';
        const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);

        if (sortedCountries.length > 0) {
            sortedCountries.forEach(([country, count]) => {
                const statLine = document.createElement('div');
                statLine.className = 'flex justify-between items-center';
                statLine.innerHTML = `
                    <span class="text-gray-600">${country}</span>
                    <span class="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">${count}</span>
                `;
                companiesPerCountryEl.appendChild(statLine);
            });
        } else {
            companiesPerCountryEl.innerHTML = '<p class="text-gray-500 text-center">No data</p>';
        }
    }

    /**
     * Populates the filter dropdowns with unique values from the data.
     * @param {Array<Object>} data - The array of company objects.
     */
    function populateFilters(data) {
        const sectors = [...new Set(data.map(company => company.sector))].sort();
        const countries = [...new Set(data.map(company => company.location.split(', ').pop()))].sort();

        sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector;
            option.textContent = sector;
            filterSectorSelect.appendChild(option);
        });

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            filterLocationSelect.appendChild(option);
        });
    }

    /**
     * Renders the company cards to the page and updates stats.
     * @param {Array<Object>} data - The array of company objects to render.
     */
    function renderCompanies(data) {
        updateStats(data);
        companyList.innerHTML = '';

        if (data.length === 0) {
            noResultsDiv.classList.remove('hidden');
        } else {
            noResultsDiv.classList.add('hidden');
        }

        data.forEach(company => {
            const card = document.createElement('div');
            card.className = 'card bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col';
            card.innerHTML = `
                <div class="flex-grow">
                    <h2 class="text-xl font-bold text-gray-900">${company.name}</h2>
                    <p class="text-indigo-600 font-semibold mt-1">${company.sector}</p>
                    <p class="text-gray-500 text-sm mt-1">${company.location}</p>
                    <p class="text-gray-700 mt-4">${company.description}</p>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                     <p class="text-sm text-gray-600"><strong>Revenue:</strong> ${company.revenue}</p>
                </div>
            `;
            companyList.appendChild(card);
        });
    }

    /**
     * Filters the company data based on user input and dropdown selections.
     */
    function filterAndRender() {
        const nameQuery = searchNameInput.value.toLowerCase();
        const sectorQuery = filterSectorSelect.value;
        const locationQuery = filterLocationSelect.value;

        const filteredCompanies = companies.filter(company => {
            const nameMatch = company.name.toLowerCase().includes(nameQuery);
            const sectorMatch = sectorQuery ? company.sector === sectorQuery : true;
            const locationMatch = locationQuery ? company.location.includes(locationQuery) : true;
            return nameMatch && sectorMatch && locationMatch;
        });

        renderCompanies(filteredCompanies);
    }

    // Event Listeners for the search and filter inputs
    searchNameInput.addEventListener('input', filterAndRender);
    filterSectorSelect.addEventListener('change', filterAndRender);
    filterLocationSelect.addEventListener('change', filterAndRender);
});