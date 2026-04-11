import dotenv from 'dotenv';
dotenv.config();

var KEY = process.env.GEMINI_API_KEY;
var url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + KEY;

fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
        var models = data.models || [];
        var liveModels = models.filter(function (m) {
            return m.name.toLowerCase().indexOf('live') >= 0 || m.name.toLowerCase().indexOf('flash') >= 0;
        });
        liveModels.forEach(function (m) {
            console.log(m.name + ' -> ' + (m.supportedGenerationMethods || []).join(', '));
        });
    })
    .catch(function (e) { console.log('Error: ' + e.message); });
