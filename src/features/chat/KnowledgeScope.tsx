import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { FileText, Folder } from "lucide-react";
import { ErrorState, LoadingState } from "../../components/ui";
import { errorMessage } from "../../lib/api/client";
import { documentApi } from "../documents/api";
import { folderApi, FolderIcon, folderPath, insideFolder } from "../documents/folders";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import type { DocumentContext } from "./api";

export function KnowledgeScope({ context, onChange, disabled, foldersSupported, saving, persisted }: {
  context: DocumentContext; onChange: (value: DocumentContext) => void; disabled: boolean;
  foldersSupported: boolean; saving: boolean; persisted: boolean;
}) {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState<"folders" | "files">(foldersSupported ? "folders" : "files");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const library = useQuery({ queryKey: ["documents", workspace.id], queryFn: () => documentApi.list(workspace.id) });
  const folders = useQuery({ queryKey: ["folders", workspace.id], queryFn: () => folderApi.list(workspace.id), enabled: foldersSupported });
  const files = context.documents.map(d => ({ ...d, available: d.available && (!library.data || library.data.some(item => item.id === d.id)) }));
  const hasSources = files.some(d => d.available) || context.folders.some(f => f.available && f.documentCount > 0);
  const shownFiles = library.data?.filter(d => d.filename.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || (filter === "unfiled" ? !d.folderId : insideFolder(d.folderId, filter, folders.data ?? []))));
  const shownFolders = folders.data?.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  return <section className="studio-document-selection scope-picker" aria-label="Conversation knowledge sources">
    <div className="studio-selected-chips">
      {context.folders.map(f => <span key={f.id} className={`studio-source-chip ${!f.available ? "unavailable" : ""}`}><Folder size={14} />
        <span>{f.name}<strong>{!f.available ? " · Unavailable" : ` · ${f.documentCount} files`}</strong></span>
        <button type="button" aria-label={`Remove folder ${f.name}`} disabled={disabled} onClick={() => onChange({ ...context, folders: context.folders.filter(item => item.id !== f.id) })}>×</button></span>)}
      {files.map(d => <span key={d.id} className={`studio-source-chip ${!d.available ? "unavailable" : ""}`}><FileText size={14} />
        <span>{d.filename}{!d.available && <strong> · Unavailable (deleted)</strong>}</span>
        <button type="button" aria-label={`Remove ${d.filename} from selection`} disabled={disabled} onClick={() => onChange({ ...context, documents: context.documents.filter(item => item.id !== d.id) })}>×</button></span>)}
    </div>
    <details className="studio-document-picker"><summary>Choose sources · {context.folders.length} folders, {files.length} files</summary>
      <div className="scope-tabs" role="group" aria-label="Source selection type"><button type="button" aria-pressed={tab === "folders"} disabled={!foldersSupported} onClick={() => { setTab("folders"); setSearch(""); }}>Folders</button><button type="button" aria-pressed={tab === "files"} onClick={() => { setTab("files"); setSearch(""); }}>Individual files</button></div>
      {!foldersSupported && <p>Rebuild the backend to enable folder selection. Individual files are still available.</p>}
      <label>Search {tab === "folders" ? "folders" : "files"}<input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "folders" ? "Find a folder…" : "Find a file…"} /></label>
      {tab === "folders" ? <>
        <p className="muted">Search the current contents of selected folders. Files you add later are included automatically.</p>
        {folders.isPending ? <LoadingState /> : folders.isError ? <ErrorState message={errorMessage(folders.error)} retry={() => void folders.refetch()} /> :
          <div className="studio-document-options">{shownFolders?.map(f => { const checked = context.folders.some(item => item.id === f.id); return <label key={f.id}>
            <input type="checkbox" checked={checked} disabled={disabled || (!checked && context.folders.length >= 50)} onChange={() => onChange({ ...context, folders: checked ? context.folders.filter(item => item.id !== f.id) : [...context.folders, { id: f.id, name: f.name, available: true, documentCount: f.documentCount }] })} />
            <span className={`scope-folder-icon folder-tone tone-${f.color.toLowerCase()}`}><FolderIcon name={f.icon} /></span><span>{folderPath(f, folders.data ?? [])}</span><small>{f.documentCount} files</small></label>; })}
            {!shownFolders?.length && <p>No folders found. <Link to={`/workspaces/${workspace.id}/knowledge`}>Organize your library</Link></p>}</div>}
      </> : <>
        <label className="scope-filter">Filter by folder<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All folders</option><option value="unfiled">Unfiled</option>{folders.data?.map(f => <option key={f.id} value={f.id}>{folderPath(f, folders.data ?? [])}</option>)}</select></label>
        <p className="muted">Choose specific files independently of folders. A file selected both ways is searched once.</p>
        {library.isPending ? <LoadingState /> : library.isError ? <ErrorState message={errorMessage(library.error)} retry={() => void library.refetch()} /> :
          <div className="studio-document-options">{shownFiles?.map(d => { const checked = files.some(item => item.id === d.id); return <label key={d.id}>
            <input type="checkbox" checked={checked} disabled={disabled || (!checked && files.length >= 50)} onChange={() => onChange({ ...context, documents: checked ? context.documents.filter(item => item.id !== d.id) : [...context.documents, { id: d.id, filename: d.filename, available: true }] })} /><FileText size={15} /><span>{d.filename}</span><small>{d.chunkCount} passages</small></label>; })}
            {!shownFiles?.length && <p>No files found. <Link to={`/workspaces/${workspace.id}/knowledge`}>Open your library</Link></p>}</div>}
      </>}
    </details>
    <small role="status">{saving ? "Saving sources…" : context.useDocuments && !hasSources ? "Choose an available file or a folder containing documents to send." : persisted ? "Sources saved with this conversation." : "Sources will be saved with your first message."}</small>
    {(files.some(d => !d.available) || context.folders.some(f => !f.available)) && <p className="muted">Unavailable sources are not searched. Earlier answer excerpts remain in history.</p>}
  </section>;
}
