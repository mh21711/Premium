
function convertToArabicNumerals(number) {
    return number.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function getIdFromCurrentUrl() {
    const path = window.location.pathname; // e.g., '/premium/2'
    const regex = /\/premium\/(\d+)/; // Regular expression to match '/premium/ID'
    const match = path.match(regex);
    return match ? parseInt(match[1], 10) : null;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-indexed
    const day = ('0' + date.getDate()).slice(-2);
    return `${convertToArabicNumerals(day)}-${convertToArabicNumerals(month)}-${convertToArabicNumerals(year)}`;
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function fetchPremiums() {
    fetch('/api/premiums')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("container-premium")
            container.innerHTML = '';

            if (Array.isArray(data)) {
                data.forEach(premium_data => {
                    let price = 0
                    if (premium_data.bids.length > 0) {
                        price = convertToArabicNumerals(premium_data.bids[premium_data.bids.length - 1].new_price)
                    } else {
                        price = convertToArabicNumerals(premium_data.price)
                    }
                    const premium = document.createElement("a");
                    premium.href = `premium/${premium_data.id}`
                    premium.innerHTML = `
                        <div id="grid">
                            <h4>${premium_data.user.username}</h4>
                            <h5>${premium_data.people}</h5>
                            <h6>${premium_data.product}</h6>
                            <p>${price} ج</p>
                        </div>
                    `
                    container.append(premium)
                });
            }
        })
}

function createBid(premiumId) {
    const bid = document.getElementById("bid").value;
    const reason_div = document.getElementById("reason_div")
    let reason = ""
    if (reason_div) {
        reason = document.getElementById("reason").value;
        console.log(reason)
    }
    if (bid > 0) {
        if (reason) {
            fetch('/api/bids/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    premiumId: premiumId,
                    bid: parseInt(bid),
                    reason: reason,
                }),
            })
            .then(response => {
                if (response.status === 201) {
                    location.reload()
                }
            })
        } else {
            fetch('/api/bids/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    premiumId: premiumId,
                    bid: parseInt(bid),
                }),
            })
            .then(response => {
                if (response.status === 201) {
                    location.reload()
                }
            })
        }
    }
}

function UnChangeButtons(premiumId) {
    buttons = document.getElementById("form")
    buttons.innerHTML = `
        <input type="number" id="bid" placeholder="السعر" />
        <div id="buttons">
            <button class="btn btn-primary" onclick="createBid(${premiumId})">نقص</button>
            <button class="btn btn-secondary" onclick="changebuttons()">زيادة</button>
        </div>
    `
}

function changebuttons(premiumId) {
    buttons = document.getElementById("form")
    buttons.innerHTML = `
        <input type="number" id="bid" placeholder="السعر" />
        <div id="reason_div">
            <input type="text" id="reason" placeholder="المنتج" />
        </div>
        <div id="buttons">
            <button class="btn btn-primary" onclick="UnChangeButtons(${premiumId})")">تراجع</button>
            <button class="btn btn-secondary" onclick="createBid(${premiumId})">زيادة</button>
        </div>
    `
}

function DeleteBid(bidId, premiumId) {
    fetch('/api/bids/', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            premiumId: premiumId,
            bidId: bidId,
        }),
    })
    .then(response => {
        if (response.status === 200) {
            location.reload()
        }
    })
}

function DeletePremium(premiumId) {
    fetch('/api/premium/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            premiumId: premiumId,
        }),
    })
    .then(response => {
        if (response.status === 200) {
            location.href = '/';
        }
    })
}

function fetchPremium(premiumId, userID) {
    fetch(`/api/premium/?id=${premiumId}`)
        .then(response => response.json())
        .then(data => {
            const premium = data[0];
            const container = document.getElementById("container-1")
            const format_createdAt = formatDate(premium.created_at)
            const price = convertToArabicNumerals(premium.price)
            console.log(premium)
            container.innerHTML = `
                <h1>المستخدم: ${premium.user.username}</h1>
                <h2>الشخص: ${premium.people}</h2>
                <h3>المنتج: ${premium.product}</h3>
                <p>تاريخ الانشاء: ${format_createdAt}</p>
                <h4>السعر: ${price} ج</h4>
                ${premium.user.id == userID ? `<button class="btn btn-danger" onclick="DeletePremium(${premiumId})">حذف الصفحة</button>` : ``}
                <h2 id="h2">قسط</h2>
                <div id="container-2">
                </div>
            `

            for (let i = 0; i < premium.bids.length; i++) {
                const container_2 = document.getElementById("container-2")
                const contain = document.createElement("div")
                contain.classList.add("contain");
                contain.innerHTML += `
                        <h4>${convertToArabicNumerals(parseInt(premium.bids[i].old_price))} ج</h4>
                        <span>${premium.bids[i].cara}</span>
                        <span>${formatDate(premium.bids[i].created_at)}</span>
                        <div>${premium.bids[i].reason}</div>
                        <h4>${convertToArabicNumerals(parseInt(premium.bids[i].bid))} ج</h4>
                        ${premium.bids.length - 1 === i ? `<h4>${convertToArabicNumerals(parseInt(premium.bids[i].new_price))} ج</h4>` : ``}
                        ${premium.bids.length - 1 === i && premium.user.id == userID ? 
                            `<button class="btn btn-danger" onclick="DeleteBid(${premium.bids[i].id}, ${premiumId})">حذف القسط</button>` : ``}
                `

                container_2.append(contain)
            }

            if (premium.bids.length === 0) {
                const container_2 = document.getElementById("container-2")
                container_2.innerHTML = `
                    <h4>${price} ج</h4>
                `
            }

            if (premium.user.id == userID) {
                const container_2 = document.getElementById("container-2")
                const form = document.createElement("div")
                form.id = "form";
    
                if (premium.bids.length === 0) {
                    form.innerHTML = `
                        <input type="number" id="bid" placeholder="السعر" />
                        <div id="buttons">
                            <button class="btn btn-primary" onclick="createBid(${premiumId})">نقص</button>
                            <button class="btn btn-secondary" onclick="changebuttons(${premiumId})">زيادة</button>
                        </div>
                    `
                } else {
                    if (premium.bids[premium.bids.length - 1].new_price === 0) {
                        form.innerHTML = `
                            <input type="number" id="bid" placeholder="السعر" />
                            <div id="reason_div">
                                <input type="text" id="reason" placeholder="المنتج" />
                            </div>
                            <div id="buttons">
                                <button class="btn btn-secondary" onclick="createBid(${premiumId})">زيادة</button>
                            </div>
                        `
                    } else {
                        form.innerHTML = `
                            <input type="number" id="bid" placeholder="السعر" />
                            <div id="buttons">
                                <button class="btn btn-primary" onclick="createBid(${premiumId})">نقص</button>
                                <button class="btn btn-secondary" onclick="changebuttons(${premiumId})">زيادة</button>
                            </div>
                        `
                    }
                } 
    
                container_2.append(form)
            }
        })
}

function fetchSearch(value) {
    fetch(`/api/search/?value=${value}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("container-premium")
            container.innerHTML = ''; // Clear previous results

            if (Array.isArray(data)) {
                data.forEach(premium_data => {
                    let price = 0
                    if (premium_data.bids.length > 0) {
                        price = convertToArabicNumerals(premium_data.bids[premium_data.bids.length - 1].new_price)
                    } else {
                        price = convertToArabicNumerals(premium_data.price)
                    }

                    const premium = document.createElement("a");
                    premium.href = `premium/${premium_data.id}`
                    premium.innerHTML = `
                        <div id="grid">
                            <h4>${premium_data.user.username}</h4>
                            <h5>${premium_data.people}</h5>
                            <h6>${premium_data.product}</h6>
                            <p>${price} ج</p>
                        </div>
                    `
                    container.append(premium)
                });
            }
        });
}

function fetchPremiumsLate() {
    fetch('/api/premiums/late')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("container-premiums")

            if (Array.isArray(data)) {
                data.forEach(premium_data => {
                    let price = 0
                    if (premium_data.bids.length > 0) {
                        price = convertToArabicNumerals(premium_data.bids[premium_data.bids.length - 1].new_price)
                    } else {
                        price = convertToArabicNumerals(premium_data.price)
                    }

                    const premium = document.createElement("a");
                    premium.href = `premium/${premium_data.id}`
                    premium.innerHTML = `
                        <div id="grid">
                            <h4>${premium_data.user.username}</h4>
                            <h5>${premium_data.people}</h5>
                            <h6>${premium_data.product}</h6>
                            <p>${price} ج</p>
                        </div>
                    `
                    container.append(premium)
                });
            }
        })
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("nav-button").onclick = () => {
        const nav = document.getElementById("navbarSupportedContent");
        nav.style.display = nav.style.display === "block" ? "none" : "block";
    }

    const container = document.getElementById("container-premium");
    const container_premium = document.getElementById("container-1");
    const container_premiums_late = document.getElementById("container-premiums")

    if (container) {
        fetchPremiums()
        document.getElementById("search").oninput = (event) => {
            const value = event.target.value;  // Get the value as the user types
            if (value) {
                fetchSearch(value);
            } else {
                fetchPremiums()
            }
        }
    } else if (container_premium) {
        const Id = getIdFromCurrentUrl()
        const userID = document.getElementById('user').value;
        fetchPremium(Id, userID)
    } else if (container_premiums_late) {
        fetchPremiumsLate()
    }
})
