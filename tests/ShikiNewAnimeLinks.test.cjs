const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'shikimori', 'ShikiNewAnimeLinks.user.js');
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
    location: { href: 'https://shikimori.io/' }
};

vm.createContext(sandbox);
vm.runInContext(`${source}
globalThis.createExternalLinkForTest = createExternalLink;
globalThis.externalLinkIconStyleForTest = externalLinkIconStyle;`, sandbox);

function makeElement(tagName) {
    return {
        tagName: tagName.toUpperCase(),
        children: [],
        appendChild(child) {
            child.parentElement = this;
            this.children.push(child);
        }
    };
}

test('creates a real anchor without inheriting the official site data-href', () => {
    sandbox.document = { createElement: makeElement };

    const headline = makeElement('div');
    const officialWrapper = makeElement('div');
    officialWrapper.className = 'b-external_link official_site b-menu-line';
    const officialLink = makeElement('div');
    officialLink.className = 'linkeable b-link';
    officialLink.dataset = { href: 'https://official.example/' };
    officialWrapper.appendChild(officialLink);

    const parent = {
        children: [headline, officialWrapper],
        insertBefore(element, reference) {
            const index = reference ? this.children.indexOf(reference) : this.children.length;
            this.children.splice(index, 0, element);
        }
    };

    const link = sandbox.createExternalLinkForTest(
        parent,
        'linkRutracker',
        'Rutracker',
        'https://rutracker.org/forum/tracker.php?nm=Cowboy%20Bebop'
    );

    assert.equal(parent.children[1].className, 'b-external_link b-menu-line');
    assert.equal(parent.children[2], officialWrapper);
    assert.equal(link.tagName, 'A');
    assert.equal(link.className, 'b-link');
    assert.equal(link.id, 'linkRutracker');
    assert.equal(link.href, 'https://rutracker.org/forum/tracker.php?nm=Cowboy%20Bebop');
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.dataset, undefined);
    assert.equal(officialLink.dataset.href, 'https://official.example/');
});

test('defines the pseudo-element dimensions required for custom link icons', () => {
    const style = sandbox.externalLinkIconStyleForTest;

    assert.match(style, /\.b-external_link > a\[id\]\.b-link:before/);
    assert.match(style, /content:\s*''/);
    assert.match(style, /height:\s*19px/);
    assert.match(style, /width:\s*19px/);
});
