import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, ErrorState, Input } from "../../components/ui";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { errorMessage } from "../../lib/api/client";
import { folderApi, folderIcons, folderColors, FolderIcon, folderPath, insideFolder, type DocumentFolder, type FolderInput, type FolderIconName } from "./folders";

export function FolderEditor({ folder, folders, onSaved, onCancel }: {
  folder?: DocumentFolder; folders: DocumentFolder[]; onSaved: (folder: DocumentFolder) => Promise<void>; onCancel: () => void;
}) {
  const { workspace } = useWorkspace();
  const [values, setValues] = useState<FolderInput>(folder ? { name: folder.name, icon: folder.icon, color: folder.color, parentId: folder.parentId } : { name: "", icon: "FOLDER", color: "BLUE" });
  const save = useMutation({ mutationFn: folderApi.save, onSuccess: onSaved });
  return <section className="library-panel folder-editor" aria-labelledby="folder-editor-title">
    <h2 id="folder-editor-title">{folder ? "Edit folder" : "New folder"}</h2>
    <p className="muted">Give your documents a clear home. Icons and colors help you recognize it.</p>
    <form onSubmit={e => { e.preventDefault(); if (values.name.trim() && !save.isPending) save.mutate({ ...values, name: values.name.trim(), id: folder?.id, workspaceId: workspace.id }); }}>
      <fieldset disabled={save.isPending} className="folder-editor-fields">
        <label>Folder name<Input autoFocus required maxLength={80} value={values.name} placeholder="e.g. Work agreements" onChange={e => setValues({ ...values, name: e.target.value })} /></label>
        <label>Parent folder<select value={values.parentId ?? ""} onChange={e => setValues({ ...values, parentId: e.target.value || null })}>
          <option value="">Workspace root</option>{folders.filter(f => !folder || !insideFolder(f.id, folder.id, folders)).map(f => <option key={f.id} value={f.id}>{folderPath(f, folders)}</option>)}
        </select></label>
        <fieldset><legend>Icon</legend><div className="folder-icon-options">{(Object.keys(folderIcons) as FolderIconName[]).map(key =>
          <label key={key} className={values.icon === key ? "selected" : ""}>
            <input type="radio" name="folder-icon" value={key} checked={values.icon === key} onChange={() => setValues({ ...values, icon: key })} />
            <FolderIcon name={key} /><span>{folderIcons[key].label}</span>
          </label>)}</div></fieldset>
        <fieldset><legend>Color</legend><div className="folder-color-options">{folderColors.map(color =>
          <label key={color} className={`folder-tone tone-${color.toLowerCase()} ${values.color === color ? "selected" : ""}`}>
            <input type="radio" name="folder-color" checked={values.color === color} onChange={() => setValues({ ...values, color })} />
            <span>{color.charAt(0) + color.slice(1).toLowerCase()}</span>
          </label>)}</div></fieldset>
      </fieldset>
      {save.isError && <ErrorState message={errorMessage(save.error)} />}
      <div className="library-actions"><Button type="submit" className="primary" disabled={!values.name.trim() || save.isPending}>{save.isPending ? "Saving…" : "Save folder"}</Button>
        <Button type="button" disabled={save.isPending} onClick={onCancel}>Cancel</Button></div>
    </form>
  </section>;
}
