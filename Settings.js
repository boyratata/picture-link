import { showToast } from "@vendetta/ui/toasts";
import { ReactNative as RN } from "@vendetta/metro/common";
import { BetterTableRowGroup } from "$/components/BetterTableRow";
import { useProxy } from "$/stuff/hooks";
import { storage } from "..";

const extOptions = ["auto", "png", "jpeg", "gif"];

export default () => {
    useProxy(storage);

    return (
        <RN.ScrollView>
            <BetterTableRowGroup title="Settings">
                <BetterTableRowGroup.Switch
                    label="Enable Guild Icon Preview"
                    value={storage.guildIconPreview}
                    onValueChange={(v) => {
                        storage.guildIconPreview = v;
                        showToast(`Guild icon preview ${v ? "enabled" : "disabled"}`);
                    }}
                />
                <BetterTableRowGroup.Select
                    label="Image Format"
                    value={storage.imageFormat}
                    options={extOptions.map(x => ({ label: x.toUpperCase(), value: x }))}
                    onChange={(val) => {
                        storage.imageFormat = val;
                        showToast(`Image format set to ${val}`);
                    }}
                />
            </BetterTableRowGroup>
        </RN.ScrollView>
    );
};
