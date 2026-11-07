import { useState } from "react";
import { Search, Upload, FileText } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input } from "../../components/ui";
const documents = [
  {
    name: "Product handbook",
    type: "PDF",
    size: "2.4 MB",
    team: "Product",
    date: "Demo record",
  },
  {
    name: "Engineering principles",
    type: "MD",
    size: "18 KB",
    team: "Engineering",
    date: "Demo record",
  },
  {
    name: "Getting started guide",
    type: "DOCX",
    size: "840 KB",
    team: "People",
    date: "Demo record",
  },
  {
    name: "Brand guidelines",
    type: "PDF",
    size: "5.1 MB",
    team: "Design",
    date: "Demo record",
  },
];
export function Documents() {
  const [search, setSearch] = useState("");
  const filtered = documents.filter((d) =>
    `${d.name} ${d.type} ${d.team}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE COLLECTIVE KNOW-HOW</p>
          <h1>Document library</h1>
          <p>A home for the knowledge your team builds on.</p>
        </div>
        <div>
          <Button disabled title="File ingestion is coming in Phase 2">
            <Upload size={16} /> Upload document
          </Button>
          <small className="muted block">Coming in Phase 2</small>
        </div>
      </div>
      <div className="notice">
        <Badge>Demo library</Badge>These sample records are illustrative. No
        files are stored or indexed.
      </div>
      <Card>
        <div className="section-heading">
          <h2>
            All documents <span className="muted">({filtered.length})</span>
          </h2>
          <div className="search-input">
            <Search size={17} />
            <Input
              aria-label="Search demo documents"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Document name</th>
                  <th>Type</th>
                  <th>Workspace</th>
                  <th>Size</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.name}>
                    <td>
                      <span className="document-name">
                        <FileText size={20} />
                        <strong>{d.name}</strong>
                      </span>
                    </td>
                    <td>
                      <Badge>{d.type}</Badge>
                    </td>
                    <td>{d.team}</td>
                    <td>{d.size}</td>
                    <td>
                      <span className="muted">{d.date}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No matching documents">
            Try a different title, file type, or team.
          </EmptyState>
        )}
      </Card>
    </>
  );
}
