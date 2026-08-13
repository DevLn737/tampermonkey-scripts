const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'shikimori', 'ShikiAnimeOP&ED.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');

const sandbox = {
    ChtwSettings: class {},
    URL,
    console,
    document: {
        addEventListener() {},
        attachEvent: false,
        readyState: 'loading'
    },
    window: {
        location: {
            origin: 'https://shikimori.io',
            pathname: '/animes/1-cowboy-bebop'
        }
    }
};

vm.createContext(sandbox);
vm.runInContext(`${source}
globalThis.extractAnimeThemesForTest = extractAnimeThemes;
globalThis.chooseAnimeThemesResultForTest = chooseAnimeThemesResult;
globalThis.requestAnimeThemesForTest = requestAnimeThemes;
globalThis.toTitlesForTest = toTitles;`, sandbox);

test('accepts the current Shikimori array form of english titles', () => {
    assert.deepEqual(
        Array.from(sandbox.toTitlesForTest(['Cowboy Bebop', 'Cowboy Bebop TV'])),
        ['Cowboy Bebop', 'Cowboy Bebop TV']
    );
});

test('converts AnimeThemes OP and ED records to the existing display format', () => {
    const themes = sandbox.extractAnimeThemesForTest({
        animethemes: [
            {
                type: 'ED',
                sequence: 1,
                slug: 'ED1',
                song: { title: 'The Real Folk Blues', artists: [{ name: 'The Seatbelts' }] }
            },
            {
                type: 'OP',
                sequence: null,
                slug: 'OP1',
                song: { title: 'Tank!', artists: [] }
            }
        ]
    });

    assert.deepEqual(Array.from(themes.openings), ['#1 Tank!']);
    assert.deepEqual(Array.from(themes.endings), ['#1 The Real Folk Blues by The Seatbelts']);
});

test('prefers an exact title and year match from AnimeThemes search results', () => {
    const selected = sandbox.chooseAnimeThemesResultForTest([
        { name: 'Cowboy Bebop: Tengoku no Tobira', year: 2001, animethemes: [{}] },
        { name: 'Cowboy Bebop', year: 1998, animethemes: [{}] }
    ], ['Cowboy Bebop'], 1998);

    assert.equal(selected.name, 'Cowboy Bebop');
});

test('requests AnimeThemes by title when the primary source is unavailable', async () => {
    let requestedUrl = '';
    sandbox.GM_xmlhttpRequest = options => {
        requestedUrl = options.url;
        options.onload({
            status: 200,
            responseText: JSON.stringify({
                anime: [{
                    name: 'Cowboy Bebop',
                    year: 1998,
                    animethemes: [
                        { type: 'OP', slug: 'OP1', song: { title: 'Tank!', artists: [] } }
                    ]
                }]
            })
        });
        return { abort() {} };
    };

    const themes = await sandbox.requestAnimeThemesForTest('1', {
        titles: ['Cowboy Bebop'],
        year: 1998
    });
    const url = new URL(requestedUrl);

    assert.equal(url.origin, 'https://api.animethemes.moe');
    assert.equal(url.searchParams.get('q'), 'Cowboy Bebop');
    assert.deepEqual(Array.from(themes.openings), ['#1 Tank!']);
});
