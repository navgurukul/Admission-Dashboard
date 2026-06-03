import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, ImageIcon, Trash2, Wand2 } from "lucide-react";
import { isLegacyTemplateImageUrl } from "@/utils/templateImageUrls";

interface EditorImageToolbarProps {
  imageSrc: string;
  imageAlt?: string;
  onReplaceWithS3: () => void;
  onBrowseS3: () => void;
  onUpload: () => void;
  onRemove: () => void;
  onCopyUrl: () => void;
}

export const EditorImageToolbar = ({
  imageSrc,
  imageAlt,
  onReplaceWithS3,
  onBrowseS3,
  onUpload,
  onRemove,
  onCopyUrl,
}: EditorImageToolbarProps) => {
  const isLegacy = isLegacyTemplateImageUrl(imageSrc);

  return (
    <div className="border-b bg-amber-50/90 p-3 md:p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
        <ImageIcon className="h-4 w-4" />
        Logo / image selected
        {imageAlt ? <span className="font-normal text-amber-800">({imageAlt})</span> : null}
      </div>

      {isLegacy ? (
        <Alert className="border-amber-300 bg-amber-100/80 py-2">
          <AlertDescription className="text-xs text-amber-950">
            Local path ({imageSrc}) — OK for today&apos;s PDF if the server has{" "}
            <code>images/ng.png</code>. To store image in this HTML: upload logo for the campus first,
            then &quot;Select Asset URL&quot; and Save template.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Current src</Label>
        <p className="rounded border bg-white/80 p-2 text-[11px] font-mono break-all">{imageSrc}</p>
      </div> */}

      <div className="flex flex-wrap gap-2">
        {isLegacy ? (
          <Button size="sm" type="button" onClick={onReplaceWithS3}>
            <Wand2 className="mr-2 h-4 w-4" />
            Select Asset URL
          </Button>
        ) : null}
        <Button size="sm" variant="outline" type="button" onClick={onBrowseS3}>
          Replace Asset
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={onUpload}>
          Upload &amp; replace
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={onCopyUrl}>
          <Copy className="mr-2 h-4 w-4" />
          Copy URL
        </Button>
        {!isLegacy && imageSrc ? (
          <Button size="sm" variant="outline" type="button" onClick={() => window.open(imageSrc, "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </Button>
        ) : null}
        <Button size="sm" variant="destructive" type="button" onClick={onRemove}>
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
};
