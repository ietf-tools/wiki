const cheerio = require('cheerio')
const ietfTransform = require('../modules/rendering/html-ietf-custom/renderer.js')

describe('IETF Custom URLs', () => {

  it('Adds the <a href/> tags to RFC mentions', () => {

    const pageHTML = '<body><div><p>Adding an RFC number to a wiki document,' +
                     ' such as \'RFC 2026\' or \'RFC2026\' automatically gen' +
                     'erates a link to that RFC. No link is added for a conc' +
                     'atenated reference, like rfc7991bis.rnc or kramdown-rf' +
                     'c2629</p></div></body>'

    const expected = '<html><head></head><body><div><p>Adding an RFC number ' +
                     'to a wiki document, such as \'<a href="https://datatra' +
                     'cker.ietf.org/doc/rfc2026/">RFC 2026</a>\' or \'<a hre' +
                     'f="https://datatracker.ietf.org/doc/rfc2026/">RFC2026<' +
                     '/a>\' automatically generates a link to that RFC. No l' +
                     'ink is added for a concatenated reference, like rfc799' +
                     '1bis.rnc or kramdown-rfc2629</p></div></body></html>'

    // load the page into cheerio
    const $ = cheerio.load(pageHTML, {
      decodeEntities: true
    })

    // transform the data using the custom IETF plugin
    ietfTransform.init($)

    // and get the HTML response after previous transformation
    const result = $.html()
    expect(result).toEqual(expected)
  })

  it('Adds the <a href/> tags to draft mentions', () => {

    const pageHTML = '<body><div><p>Adding the name of an Internet Draft to ' +
                     'a wiki document, such as \'draft-ietf-taps-impl\' auto' +
                     'matically generates a link to that I-D</p></div></body>'

    const expected = '<html><head></head><body><div><p>Adding the name of an' +
                     ' Internet Draft to a wiki document, such as \'<a href=' +
                     '"https://datatracker.ietf.org/doc/draft-ietf-taps-impl' +
                     '">draft-ietf-taps-impl</a>\' automatically generates a' +
                     ' link to that I-D</p></div></body></html>'

    // load the page into cheerio
    const $ = cheerio.load(pageHTML, {
      decodeEntities: true
    })

    // transform the data using the custom IETF plugin
    ietfTransform.init($)

    // and get the HTML response after previous transformation
    const result = $.html()
    expect(result).toEqual(expected)
  })

  it('Does not break something that is already linked', () => {

    const pageHTML = '<body><div><p>If the rfc/draft mention is inside an HT' +
                     'ML tag, such as <a href="https://rfc-editor.org/info/r' +
                     'fc8729">RFC Streams</a>, no additional processing is d' +
                     'one.</p></div></body>'

    const expected = '<html><head></head><body><div><p>If the rfc/draft ment' +
                     'ion is inside an HTML tag, such as <a href=\"https://r' +
                     'fc-editor.org/info/rfc8729\">RFC Streams</a>, no addit' +
                     'ional processing is done.</p></div></body></html>'

    // load the page into cheerio
    const $ = cheerio.load(pageHTML, {
      decodeEntities: true
    })
                     
    // transform the data using the custom IETF plugin
    ietfTransform.init($)
                     
    // and get the HTML response after previous transformation
    const result = $.html()
    expect(result).toEqual(expected) 
  }) 

  it('Does not add a link inside of an inline code block', () => {

    const pageHTML = '<body><div>First Entry is OK</div><div><p><code>In-lin' +
                     'e mentions, like RFC 21, should be ignored.</code></p>' +
                     '</body>'

    const expected = '<html><head></head><body><div>First Entry is OK</div><' +
                     'div><p><code>In-line mentions, like RFC 21, should be ' +
                     'ignored.</code></p></div></body></html>'

    // load the page into cheerio
    const $ = cheerio.load(pageHTML, {
      decodeEntities: true
    })

    // transform the data using the custom IETF plugin
    ietfTransform.init($)

    // and get the HTML response after previous transformation
    const result = $.html()
    expect(result).toEqual(expected)
  })

  it('Does not add a link inside of a code block', () => {

    const pageHTML = '<body><pre class="prismjs line-numbers"><code class="l' +
                     'anguage-bash">this is a block: rfc64</code></pre></body>'

    const expected = '<html><head></head><body><pre class=\"prismjs line-num' +
                     'bers\"><code class=\"language-bash\">this is a block: ' +
                     'rfc64</code></pre></body></html>'

    // load the page into cheerio
    const $ = cheerio.load(pageHTML, {
      decodeEntities: true
    })

    // transform the data using the custom IETF plugin
    ietfTransform.init($)

    // and get the HTML response after previous transformation
    const result = $.html()
    expect(result).toEqual(expected)
  })

  it('Does not add a link inside of a header', () => {

    const pageHTML = '<body><h1>Welcome Page for RFC 18</h1><p>rfc 18, 2</p>' +
                     '<h2>Home page rfc21</h1><p>This page was created to te' +
                     'st some of the features of the custom plugin.</p></body>'

    const expected = '<html><head></head><body><h1>Welcome Page for RFC 18</' +
                     'h1><p><a href=\"https://datatracker.ietf.org/doc/rfc18' +
                     '/\">rfc 18</a>, 2</p><h2>Home page rfc21</h2><p>This p' +
                     'age was created to test some of the features of the cu' +
                     'stom plugin.</p></body></html>'

    // load the page into cheerio
    const $ = cheerio.load(pageHTML, {
      decodeEntities: true
    })

    // transform the data using the custom IETF plugin
    ietfTransform.init($)

    // and get the HTML response after previous transformation
    const result = $.html()
    expect(result).toEqual(expected)
  })
})
