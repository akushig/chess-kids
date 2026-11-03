// Explicitly acknowledge the new, blocking explanation before interacting with the board.
exports.acknowledgePlayEvent=async page=>{
 const dialog=page.locator('#play-dialog[data-kind="event"]');
 if(await dialog.count())await dialog.locator('footer button').first().click();
};
