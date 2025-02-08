"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js")
document.querySelector('.nav-bar').style.display = 'none';

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);
	let frame = document.getElementById("uv-frame");
	
	document.querySelector('.nav-bar').style.display = 'flex';
	document.querySelector('.nav-trigger').style.display = 'block';

	frame.style.display = "block";
	let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
	if (await connection.getTransport() !== "/epoxy/index.mjs") {
		await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
	}
	frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
});

function showSearchBar() {
	document.getElementById('uv-form').style.display = 'flex';
	document.getElementById('uv-frame').style.display = 'none';
	document.querySelector('.nav-bar').style.display = 'none';
	document.querySelector('.nav-trigger').style.display = 'none';
}

function goBack() {
	document.getElementById('uv-frame').contentWindow.history.back();
}

function goForward() {
	document.getElementById('uv-frame').contentWindow.history.forward();
}

function refreshPage() {
	document.getElementById('uv-frame').contentWindow.location.reload();
}

function formatSearch(query) {
	const engine = "https://www.google.com/search?q=";
	
	try {
		return new URL(query).toString();
	} catch (e) {}
	
	try {
		const url = new URL(`https://${query}`);
		if (url.hostname.includes(".")) return url.toString();
	} catch (e) {}
	
	return engine + encodeURIComponent(query);
}

function getCleanUrl(proxyUrl) {
	try {
		const frame = document.getElementById('uv-frame');
		if (frame.contentWindow) {
			const raw = frame.contentWindow.location.href;
			const encodedUrl = raw.split('/service/')[1];
			if (!encodedUrl) return raw;
			
			return __uv$config.decodeUrl(encodedUrl);
		}
	} catch (e) {
		console.log('URL processing:', e);
	}
	return proxyUrl;
}

document.getElementById('current-url').addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		const url = formatSearch(this.value);
		registerSW().then(() => {
			const frame = document.getElementById('uv-frame');
			frame.style.display = "block";
			frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
		});
	}
});

document.getElementById('uv-frame').addEventListener('load', function() {
	const urlBar = document.getElementById('current-url');
	urlBar.value = getCleanUrl(this.contentWindow.location.href);
	urlBar.readOnly = false;
});
