import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Upload, FileText, Trash2, FolderPlus, FolderInput, SlidersHorizontal, Pencil, Files, Check } from "lucide-react";
import { Button, EmptyState, ErrorState, Input, LoadingState } from "../../components/ui";
import { documentApi } from "./api";
import { folderApi, FolderIcon, folderPath, insideFolder, type DocumentFolder } from "./folders";
import { FolderEditor } from "./FolderEditor";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { errorMessage } from "../../lib/api/client";
import "./documents.css";

export function Documents() {
  const { workspace } = useWorkspace();
  return <WorkspaceDocuments key={workspace.id} />;
}
function WorkspaceDocuments() {
  const { workspace, canEdit } = useWorkspace();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [destination, setDestination] = useState("");
  const [editor, setEditor] = useState<DocumentFolder | "new" | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const documents = useQuery({ queryKey: ["documents", workspace.id], queryFn: () => documentApi.list(workspace.id) });
  const folders = useQuery({ queryKey: ["folders", workspace.id], queryFn: () => folderApi.list(workspace.id) });
  const extension = file?.name.split(".").pop()?.toLowerCase();
  const fileLimit = extension === "txt" || extension === "md" ? 65536 : 10 * 1024 * 1024;
  const fileError = file && (!extension || !["txt", "md", "pdf", "doc", "docx"].includes(extension))
    ? "Choose a TXT, Markdown, PDF, DOC or DOCX file."
    : file && (file.size === 0 || file.size > fileLimit) ? "Choose a non-empty file: text up to 64 KiB, PDF/Word up to 10 MiB." : null;
  async function refresh() {
    await Promise.all(["documents", "folders", "conversation-documents", "workspaces"].map(key => queryClient.invalidateQueries({ queryKey: [key] })));
  }
  const upload = useMutation({ mutationFn: documentApi.upload, onSuccess: async () => {
    setFile(null); if (picker.current) picker.current.value = "";
    setNotice("Document indexed and ready to search."); await refresh();
  } });
  const remove = useMutation({ mutationFn: (id: string) => documentApi.remove(id, workspace.id), onSuccess: async (_, id) => {
    setSelected(ids => ids.filter(item => item !== id)); setNotice("Document deleted. Saved answer excerpts remain in chat history."); await refresh();
  } });
  const move = useMutation({ mutationFn: folderApi.move, onSuccess: async (_, request) => {
    setSelected([]); setNotice(`${request.documentIds.length} document${request.documentIds.length === 1 ? "" : "s"} moved${request.folderId ? " to the selected folder" : " to Unfiled"}.`); await refresh();
  } });
  const busy = !canEdit || upload.isPending || remove.isPending || move.isPending;
  const activeFolder = folders.data?.find(f => f.id === filter);
  const filtered = (documents.data ?? []).filter(d =>
    d.filename.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || (filter === "unfiled" ? !d.folderId : insideFolder(d.folderId, filter, folders.data ?? []))) &&
    (type === "all" || (type === "word" ? /\.(doc|docx)$/i.test(d.filename) : d.filename.toLowerCase().endsWith(`.${type}`)))
  ).sort((a, b) => sort === "name" ? a.filename.localeCompare(b.filename) : b.createdAt.localeCompare(a.createdAt));
  function changeFilter(next: string) { setFilter(next); setSelected([]); }
  const visibleIds = filtered.slice(0, 100).map(d => d.id);
  const allChecked = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));
  return <div className="document-library">
    <header className="library-heading"><div><p className="eyebrow">KNOWLEDGE LIBRARY</p><h1>Documents</h1><p className="muted">Organize your sources. Find the context you need.</p></div>
      <div className="library-actions"><Button disabled={busy} onClick={() => setEditor("new")}><FolderPlus size={16} />New folder</Button>
        <Button className="primary" disabled={!canEdit} aria-expanded={showUpload} onClick={() => { setShowUpload(!showUpload); setUploadFolder(activeFolder?.id ?? ""); }}><Upload size={16} />Upload document</Button></div>
    </header>
    <div className="library-meta"><span><Files size={15} />{documents.data?.length ?? "—"} documents</span><span>{folders.data?.length ?? "—"} folders</span><span>{workspace.name} · {workspace.role.toLowerCase()} access</span></div>
    {notice && <div className="library-notice" role="status"><Check size={16} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
    {folders.isError && <ErrorState message="Folders are currently unavailable. Your documents are still accessible. Try loading folders again." retry={() => void folders.refetch()} />}
    {editor && <FolderEditor key={editor === "new" ? "new" : editor.id} folder={editor === "new" ? undefined : editor} folders={folders.data ?? []} onCancel={() => setEditor(null)} onSaved={async f => {
      setNotice(editor === "new" ? "Folder created." : "Folder updated."); setEditor(null); changeFilter(f.id); await refresh();
    }} />}
    {showUpload && <section className="library-panel" aria-labelledby="upload-heading"><h2 id="upload-heading">Upload a document</h2>
      <p className="muted">PDF / Word up to 10 MiB · TXT / Markdown up to 64 KiB. Scanned files requiring OCR are not supported.</p>
      <form className="library-upload" onSubmit={e => { e.preventDefault(); if (file && !fileError && !busy) upload.mutate({ file, folderId: uploadFolder || undefined, workspaceId: workspace.id }); }}>
        <label>File<input className="input" ref={picker} type="file" accept=".txt,.md,.pdf,.doc,.docx" disabled={busy}
          onChange={e => { setFile(e.target.files?.[0] || null); upload.reset(); }} /></label>
        <label>Save in<select value={uploadFolder} disabled={busy || !folders.data} onChange={e => setUploadFolder(e.target.value)}><option value="">Unfiled</option>{folders.data?.map(f => <option key={f.id} value={f.id}>{folderPath(f, folders.data ?? [])}</option>)}</select></label>
        <Button className="primary" disabled={!file || !!fileError || busy} type="submit">{upload.isPending ? "Indexing…" : "Upload and index"}</Button>
      </form>
      {upload.isPending && <p role="status">Extracting text and creating embeddings. Keep this page open.</p>}
      {fileError && <ErrorState message={fileError} />}{upload.isError && <ErrorState message={errorMessage(upload.error)} />}
    </section>}
    <section className="library-panel library-content" aria-label="Document library">
      <div className="library-folders-heading"><span><FolderIcon name="FOLDER" />Folders</span>{activeFolder && <Button disabled={busy} onClick={() => setEditor(activeFolder)}><Pencil size={14} />Edit folder</Button>}</div>
      <div className="folder-filters" role="group" aria-label="Filter by folder">
        <button className="folder-filter" aria-pressed={filter === "all"} onClick={() => changeFilter("all")}><Files size={16} />All documents<span>{documents.data?.length ?? 0}</span></button>
        <button className="folder-filter" aria-pressed={filter === "unfiled"} onClick={() => changeFilter("unfiled")}><FolderIcon name="FOLDER" />Unfiled<span>{documents.data?.filter(d => !d.folderId).length ?? 0}</span></button>
        {folders.data?.map(f => <button key={f.id} className={`folder-filter folder-tone tone-${f.color.toLowerCase()}`} aria-pressed={filter === f.id} onClick={() => changeFilter(f.id)}><FolderIcon name={f.icon} />{folderPath(f, folders.data ?? [])}<span>{f.documentCount}</span></button>)}
      </div>
      {folders.isPending && <LoadingState />}
      {folders.data?.length === 0 && <p className="library-folder-hint">No folders yet. Create one for work, accounts, audits, or agreements.</p>}
      <div className="library-toolbar"><div className="search-input"><Search size={17} /><Input aria-label="Search documents" placeholder="Search document names" value={search} onChange={e => { setSearch(e.target.value); setSelected([]); }} /></div>
        <label><SlidersHorizontal size={15} /><span className="sr-only">File type</span><select aria-label="File type" value={type} onChange={e => { setType(e.target.value); setSelected([]); }}><option value="all">All file types</option><option value="pdf">PDF</option><option value="word">Word</option><option value="txt">Text</option><option value="md">Markdown</option></select></label>
        <label><span className="sr-only">Sort documents</span><select aria-label="Sort documents" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="name">Name A–Z</option></select></label>
      </div>
      {selected.length > 0 && <div className="library-bulk" role="region" aria-label="Move selected documents"><strong>{selected.length} selected</strong>
        <select aria-label="Destination folder" value={destination} disabled={busy || !folders.data} onChange={e => setDestination(e.target.value)}><option value="">Unfiled</option>{folders.data?.map(f => <option key={f.id} value={f.id}>{folderPath(f, folders.data ?? [])}</option>)}</select>
        <Button disabled={busy || !folders.data || selected.length > 100} onClick={() => move.mutate({ documentIds: selected, folderId: destination || null, workspaceId: workspace.id })}><FolderInput size={16} />{move.isPending ? "Moving…" : "Move"}</Button>
        <Button disabled={busy} onClick={() => setSelected([])}>Clear</Button><small>Up to 100 documents per move</small></div>}
      {move.isError && <ErrorState message={errorMessage(move.error)} />}{remove.isError && <ErrorState message={errorMessage(remove.error)} />}
      {documents.isPending ? <LoadingState /> : documents.isError ? <ErrorState message={errorMessage(documents.error)} retry={() => void documents.refetch()} /> : filtered.length ?
        <div className="table-scroll"><table className="library-table"><thead><tr><th><input type="checkbox" aria-label="Select up to 100 visible documents" checked={allChecked} disabled={busy} onChange={() => setSelected(allChecked ? [] : visibleIds.slice(0, 100))} /></th><th scope="col">Name</th><th scope="col">Folder</th><th scope="col">Size</th><th scope="col">Indexed</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{filtered.map(d => { const folder = folders.data?.find(f => f.id === d.folderId); return <tr key={d.id} className={selected.includes(d.id) ? "is-selected" : ""}>
            <td><input type="checkbox" aria-label={`Select ${d.filename}`} checked={selected.includes(d.id)} disabled={busy || (!selected.includes(d.id) && selected.length >= 100)} onChange={() => setSelected(ids => ids.includes(d.id) ? ids.filter(id => id !== d.id) : [...ids, d.id])} /></td>
            <td><div className="library-file"><span className="library-file-icon"><FileText size={20} /></span><span><strong>{d.filename}</strong><small>{d.filename.split(".").pop()?.toUpperCase()} · {d.chunkCount} indexed passages</small></span></div></td>
            <td>{folder ? <button className={`folder-label folder-tone tone-${folder.color.toLowerCase()}`} onClick={() => changeFilter(folder.id)}><FolderIcon name={folder.icon} size={14} />{folderPath(folder, folders.data ?? [])}</button> : <span className="muted">{d.folderId ? "Folder unavailable" : "Unfiled"}</span>}</td>
            <td>{(d.sizeBytes / 1024).toFixed(1)} KiB</td><td>{new Date(d.createdAt).toLocaleDateString()}</td>
            <td><Button aria-label={`Delete ${d.filename}`} disabled={busy} onClick={() => { if (window.confirm(`Delete ${d.filename} and its search index? Existing chat source excerpts will remain in history.`)) remove.mutate(d.id); }}><Trash2 size={15} /></Button></td>
          </tr>; })}</tbody></table></div> : <EmptyState title={search || type !== "all" ? "No matching documents" : activeFolder ? "This folder is empty" : "No documents here yet"}>
          {search || type !== "all" ? "Try another search or file type." : "Upload a document here, or select existing files in All documents and move them into a folder."}</EmptyState>}
      <footer className="library-footer"><span>{filtered.length} document{filtered.length === 1 ? "" : "s"}{activeFolder ? ` in ${activeFolder.name}` : ""}</span><span>Folder changes do not re-index your files</span></footer>
    </section>
  </div>;
}
