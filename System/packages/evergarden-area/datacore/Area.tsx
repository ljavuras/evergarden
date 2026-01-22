/**
 * Tag notes with areas, and they would show up in area note. Areas can be a
 * sub-area or a super-area of other areas.
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { Area } = VPS.require("evergarden-area");
const { useMemo } = dc;
const { Pill } = await dc.require("evergarden-design-system", "Primitive");

return function AreaView() {
    const area = Area.getByPath(dc.useCurrentPath());
    const subLinks = area.subLinks;

    // Build query to select notes belong to the area
    const queryAreaNotes = useMemo(
        () => {
            return "@page and !#note/area"
                + ` and (linksto([[${dc.currentPath()}]])`
                + (subLinks.length? " or " : "")
                + subLinks
                    .map(link => `linksto([[${link.path}]])`)
                    .join(" or ")
                + ")";
        },
        [
            dc.currentPath(),
            ...subLinks.map(link => dc.api.page(link.path)?.$revision)
        ]
    );
    const pageBacklinks = dc.useQuery(queryAreaNotes);

    return (
        <div className="evergarden area">
            <h1 className="title">{area.name}</h1>
            <div className="details">
                <div className="relationship">Implies</div>
                <div className="related-areas">
                    {
                        area.superLinks.map(link => {
                            link = link.withDisplay(link.fileName().slice(2))
                            return <Pill link={link} />
                        })
                    }
                </div>
                <div className="relationship">Includes</div>
                <div className="related-areas">
                    {
                        subLinks.map(link => {
                            link = link.withDisplay(link.fileName().slice(2))
                            return <Pill link={link} />
                        })
                    }
                </div>
            </div>
            <dc.VanillaTable
                rows={pageBacklinks}
                columns={[
                    {
                        id: "page",
                        title: (
                            <>
                                <dc.Icon icon="file" />
                                Note
                            </>
                        ),
                        value: (page) => page.$link
                    }
                ]}
            />
        </div>
    )
}