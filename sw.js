const CACHE_NAME = 'CampusKing_v7.0_'; 

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
	'./css/base.css',
	'./css/layout.css',
	'./css/components.css',
	'./css/landing.css',
	'./css/auth.css',
	'./css/dashboard.css',
	'./css/calendar.css',
	'./css/settings.css',
	'./js/firebase.js',
	'./js/state.js',
	'./js/ui.js',
	'./js/course.js',
	'./js/grade.js',
	'./js/notification.js',
	'./js/data.js',
	'./js/semester.js',
	'./js/auth.js',
	'./js/main.js',
	'./js/calendar.js',
	'./js/accounting.js',
	'./js/notes.js',
	'./js/anniversary.js',
	'./js/learning.js',
	'./js/lottery.js',
	'./js/homework.js',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );

});