---
created: 2026-01-05T09:56:50.387+08:00
---
# Evergarden design system

## Primitive

```datacoretsx
const { obsidian, Datacore } = await cJS();
const { Notice } = obsidian;

dc = Datacore.wrap(dc);
dc.config.dev = true;

const {
    Pill,
    InternalLink,
    ExternalLink,
    Button,
    ClickableIcon,
} = await dc.require("evergarden-design-system", "Primitive");

const link = dc.currentFile()?.$link;

function Group({ children, ...props }) {
    return (
        <div
            style={{
                display: "flex",
                gap: "var(--size-4-2)",
                "align-items": "baseline",
                margin: "var(--size-4-2) 0",
            }}
        >
            {children}
        </div>
    )
}

return (<>
    <Group>
        <InternalLink link={link}>internal link</InternalLink>
        <ExternalLink href="obsidian.md">external link</ExternalLink>
    </Group>
    <Group>
        <Pill>text pill</Pill>
        <Pill link={link}>linked pill</Pill>
    </Group>
    <Group>
        <Button onClick={() => new Notice("Regular button")}>Button</Button>
        <Button onClick={() => new Notice("Call to action")} mod="cta">
            CTA button
        </Button>
        <Button onClick={() => new Notice("Warning")} mod="warning">
            Warning
        </Button>
        <Button onClick={() => new Notice("Destructive action")} mod="destructive">
            Destructive
        </Button>
        <Button onClick={() => new Notice("Loading...")} mod="loading">
            Loading
        </Button>
    </Group>
    <Group>
        <ClickableIcon
            onClick={() => new Notice("Clickable icon")}
            icon="info"
        />
        <ClickableIcon
            onClick={() => new Notice("Active clickable icon")}
            icon="activity"
            isActive={true}
        />
    </Group>
</>)
```

## Layout

```datacoretsx
const { obsidian, Datacore } = await cJS();
const { Notice } = obsidian;

dc = Datacore.wrap(dc);
dc.config.dev = true;

const {
    List,
    ListItem,
} = await dc.require("evergarden-design-system", "Layout");

return (<>
    <List>
        <ListItem clickable>List item</ListItem>
        <ListItem clickable>List item</ListItem>
        <ListItem clickable>List item</ListItem>
    </List>
</>)
```