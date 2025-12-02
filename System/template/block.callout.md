<%*
/**
 * Choose and insert callout
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */
let callout_type = await tp.system.suggester(
    suggest_item => suggest_item,  // Display string for each callout
    [
        /** Callout types */
        "Abstract",
        "Attention",
        "Bug",
        "Caution",
        "Check",
        "Cite",
        "Danger",
        "Done",
        "Error",
        "Example",
        "Fail",
        "Failure",
        "FAQ",
        "Help",
        "Hint",
        "Important",
        "Info",
        "Missing",
        "Note",
        "Question",
        "Quote",
        "Success",
        "Summary",
        "Tip",
        "TLDR",
        "Todo",
        "Warning"
    ],
    false,
    "Select callout"
);

if (callout_type != null) {
  tR += `> [!${callout_type.toUpperCase()}]`;
}
-%>