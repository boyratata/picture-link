import { findByProps, findByName, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { ReactNative } from "@vendetta/metro/common";
import settings from "./Settings.js";

export const storage = persistPluginData("ImagePreviewPlugin", {
    guildIconPreview: true,
    imageFormat: "auto", // options: "auto", "png", "jpeg", "gif"
});

const { Pressable } = findByProps("Button", "Text", "View");
const ProfileBanner = findByName("ProfileBanner", false);
const HeaderAvatar = findByName("HeaderAvatar", false);
const { openMediaModal } = findByProps("openMediaModal");
const { hideActionSheet } = findByProps("hideActionSheet");
const { getChannelId } = findByStoreName("SelectedChannelStore");
const { getGuildId } = findByStoreName("SelectedGuildStore");

function getImageSize(uri: string): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
        ReactNative.Image.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            (error) => reject(error)
        );
    });
}

function getExtension(url: string) {
    const isAnimated = url.includes("/a_") || url.endsWith(".gif");
    switch (storage.imageFormat) {
        case "gif": return ".gif";
        case "jpeg": return ".jpeg";
        case "png": return ".png";
        case "auto": return isAnimated ? ".gif" : ".png";
        default: return ".png";
    }
}

async function openModal(src: string, event) {
    const { width, height } = await getImageSize(src);

    hideActionSheet();
    openMediaModal({
        initialSources: [{
            uri: src,
            sourceURI: src,
            width,
            height,
            guildId: getGuildId(),
            channelId: getChannelId(),
        }],
        initialIndex: 0,
        originLayout: {
            width: 0,
            height: 0,
            x: event.pageX,
            y: event.pageY,
            resizeMode: "fill",
        }
    });
}

const unpatchAvatar = after("default", HeaderAvatar, ([{ user, style, guildId }], res) => {
    let ext = "png";
    if (typeof user.guildMemberAvatars?.[guildId] === "string") {
        if (user.guildMemberAvatars?.[guildId].includes("a_")) ext = "gif";
    }

    let guildSpecific = user.guildMemberAvatars?.[guildId] &&
        `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${user.guildMemberAvatars[guildId]}.${ext}?size=4096`;

    let image = user?.getAvatarURL?.(false, 4096, true);
    if (!image) return res;

    let url = typeof image === "number"
        ? `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.id) >> 22n) % 6}.png`
        : image.replace(".webp", getExtension(image));

    delete res.props.style;

    return (
        <Pressable
            onPress={({ nativeEvent }) => openModal(url, nativeEvent)}
            onLongPress={({ nativeEvent }) => guildSpecific && openModal(guildSpecific, nativeEvent)}
            style={style}>
            {res}
        </Pressable>
    );
});

const unpatchBanner = after("default", ProfileBanner, ([{ bannerSource }], res) => {
    if (typeof bannerSource?.uri !== "string" || !res) return res;

    const raw = bannerSource.uri.replace(/(?:\?size=\d{3,4})?$/, "?size=4096");
    const url = raw.replace(".webp", getExtension(raw));

    return <Pressable onPress={({ nativeEvent }) => openModal(url, nativeEvent)}>{res}</Pressable>;
});

let unpatchGuildIcon;

if (storage.guildIconPreview) {
    const GuildIcon = findByName("GuildIcon", false);
    if (GuildIcon?.default) {
        unpatchGuildIcon = after("default", GuildIcon, ([{ size, guild }], res) => {
            if (size !== "XLARGE" || !guild?.icon) return;

            let ext = "png";
            if (guild.icon.includes("a_")) ext = "gif";

            let raw = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=4096`;
            let url = raw.replace(".webp", getExtension(raw));

            return (
                <Pressable onPress={({ nativeEvent }) => openModal(url, nativeEvent)}>
                    {res}
                </Pressable>
            );
        });
    }
}

export const onUnload = () => {
    unpatchAvatar();
    unpatchBanner();
    if (unpatchGuildIcon) unpatchGuildIcon();
};

export { settings };
