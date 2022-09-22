module.exports = {
  init($, config) {
  
    $('body').contents().toArray().forEach(item => {
      // Do not add a link if the item is already a link
      if (item && item.type === 'tag' && item.name === 'a') return;

      const rfcRegex = RegExp(/(?!rfc[ ]?[0-9]+[a-z]+)(?<!-)(rfc[ ]?[0-9]+)/, 'ig');
      const draftRegex = RegExp(/(?<!-)(draft)(((-)(\w+))+)/, 'ig');
      const openLinkTag = RegExp(/(\<[ ]?)(a href)/, 'ig');
      const closeLinkTag = RegExp(/(\<[ ]?\/[ ]?a[ ]?\>)/, 'ig');
      const openCodeTag = RegExp(/(\<[ ]?)(code)/, 'ig');
      const closeCodeTag = RegExp(/(\<[ ]?\/[ ]?(code)[ ]?\>)/, 'ig');
      const openHeadingTag = RegExp(/(\<h[0-9]\>)/, 'ig');
      const closeHeadingTag = RegExp(/(\<\/h[0-9]\>)/, 'ig');

      const origStr = $.html(item);
      let tagPairs;

      const matchTags = str => {
        let openTagLocs = [];
        let closeTagLocs = [];
        tagPairs = [];

        while ((tag = openLinkTag.exec(str)) !== null ||
               (tag = openCodeTag.exec(str)) !== null ||
               (tag = openHeadingTag.exec(str)) !== null) {
                    openTagLocs.push(tag.index);
        }
        while ((tag = closeLinkTag.exec(str)) !== null ||
               (tag = closeCodeTag.exec(str)) !== null ||
               (tag = closeHeadingTag.exec(str)) !== null) {
                    closeTagLocs.push(tag.index);
        }
        for (i = 0; i < openTagLocs.length; i++) {
          tagPairs.push(openTagLocs[i]);
          tagPairs.push(closeTagLocs[i]);
        }
      }

      const isInsideSensitiveTag = index => {
        for (i = 0; i < tagPairs.length; i+=2) {
          if (tagPairs[i] <= index && tagPairs[i+1] >= index) return true;
        }
        return false;
      }

      let rfcHtml = "";
      let prevLoc = 0;

      // first find all the open & close URL tags for the current string
      matchTags(origStr);

      // now parse for all RFC mentions
      while (rfcRegex.exec(origStr) !== null) {

        let currLoc = rfcRegex.lastIndex;
        let currStr = origStr.substring(prevLoc, currLoc);

        if (isInsideSensitiveTag(currLoc)) {
          rfcHtml += currStr;
        } else {
          rfcHtml += currStr.replace(
            /(rfc[ ]?)([0-9]+)/i,
            '<a href="https://datatracker.ietf.org/doc/rfc$2/">$1$2</a>'
          );
        }

        prevLoc = currLoc;
      }

      // add the remainder of the string without matches
      rfcHtml += origStr.substring(prevLoc);

      // next do the same for ID mentions, using the already modified html as the base
      let draftAndRfcHtml = "";
      prevLoc = 0;

      // recalculate the open and close link tags using the new html strings
      matchTags(rfcHtml);

      while (draftRegex.exec(rfcHtml) !== null) {

        let currLoc = draftRegex.lastIndex;
        let currStr = rfcHtml.substring(prevLoc, currLoc);

        if (isInsideSensitiveTag(currLoc)) {
          draftAndRfcHtml += currStr;
        } else {
          draftAndRfcHtml += currStr.replace(
            /(draft)(((-)(\w+))+)/ig,
            '<a href="https://datatracker.ietf.org/doc/draft$2">$1$2</a>'
          );
        }
        prevLoc = currLoc;
      }

      draftAndRfcHtml += rfcHtml.substring(prevLoc);

      // and make the final replacement
      $(item).replaceWith(draftAndRfcHtml);
    });

  }
}
