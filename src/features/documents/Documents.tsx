import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Upload, FileText, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState } from "../../components/ui";
import { documentApi } from "./api";
import { errorMessage } from "../../lib/api/client";

export function Documents() {
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const documents = useQuery({ queryKey: ["documents"], queryFn: documentApi.list });
  const upload = useMutation({
    mutationFn: documentApi.upload,
    onSuccess: async () => {
      setFile(null);
      if (picker.current) picker.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
  const remove = useMutation({
    mutationFn: documentApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
  const filtered = (documents.data || []).filter(d => d.filename.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">YOUR KNOWLEDGE, CONNECTED</p><h1>Document library</h1>
        <p>Private documents for grounded answers. Only your account can search these files.</p></div>
      <Badge>Local embeddings · Nomic</Badge>
    </div>
    <Card>
      <h2>Add knowledge</h2>
      <p className="muted">UTF-8 TXT or Markdown, up to 64 KiB per file. PDF, DOCX and OCR are not supported yet.</p>
      <form className="rag-upload" onSubmit={e => { e.preventDefault(); if (file) upload.mutate(file); }}>
        <label htmlFor="document-file">Choose a document</label>
        <input className="input" ref={picker} id="document-file" type="file" accept=".txt,.md" disabled={upload.isPending}
          onChange={e => { setFile(e.target.files?.[0] || null); upload.reset(); }} />
        <Button className="primary" disabled={!file || upload.isPending} type="submit">
          <Upload size={16} />{upload.isPending ? "Embedding and indexing…" : "Upload and index"}
        </Button>
      </form>
      {upload.isPending && <p role="status">Creating local embeddings. This can take a minute on the first upload. Keep this page open.</p>}
      {upload.isSuccess && <p role="status">Document indexed and ready for document chat.</p>}
      {upload.isError && <ErrorState message={errorMessage(upload.error)} />}
    </Card>
    <Card>
      <div className="section-heading"><h2>Indexed documents ({filtered.length})</h2>
        <div className="search-input"><Search size={17} /><Input aria-label="Search documents" placeholder="Search documents…"
          value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      {remove.isError && <ErrorState message={errorMessage(remove.error)} />}
      {documents.isPending ? <LoadingState /> : documents.isError ?
        <ErrorState message={errorMessage(documents.error)} retry={() => void documents.refetch()} /> : filtered.length ?
        <div className="table-scroll"><table><thead><tr><th>Document</th><th>Chunks</th><th>Size</th><th>Indexed</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(d => <tr key={d.id}>
            <td><span className="document-name"><FileText size={20} /><strong>{d.filename}</strong></span>
              <small className="muted block">{d.embeddingModel}</small></td>
            <td><Badge>{d.chunkCount} chunks</Badge></td><td>{(d.sizeBytes / 1024).toFixed(1)} KiB</td>
            <td>{new Date(d.createdAt).toLocaleDateString()}</td>
            <td><Button aria-label={`Delete ${d.filename}`} disabled={remove.isPending}
              onClick={() => { if (window.confirm(`Delete ${d.filename} and its search index? Existing chat source excerpts will remain in history.`)) remove.mutate(d.id); }}>
              <Trash2 size={16} /> Delete</Button></td>
          </tr>)}</tbody></table></div> :
        <EmptyState title={search ? "No matching documents" : "Build your knowledge library"}>
          {search ? "Try a different filename." : "Upload a text document, then enable Search my documents in Chat."}
        </EmptyState>}
    </Card>
  </>;
}
