/**
 * Utilities for Datacore scripts.
 * 
 * @example
 * const { Datacore } = VPS.require("violet-datacore");
 * dc = Datacore.wrap(dc);
 * const { combineClasses } = await dc.require("evergarden-design-system", "utils");
 */

/**
 * Appends additional classes to a basic fixed class.
 * {@link https://github.com/blacksmithgu/datacore/blob/31a8b18b0978f8b06d03d6dabcf023a7362b56f2/src/api/ui/basics.tsx#L207}
 */
function combineClasses(fixed: string, ...rest: (string | undefined)[]) {
    const nonempty = rest.filter((c) => c !== undefined);
    if (nonempty.length === 0) return fixed;

    return [fixed, ...nonempty].join(" ");
}

return { combineClasses };