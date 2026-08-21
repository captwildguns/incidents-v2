import React from 'react';
import { ForgeCard } from '@tylertech/forge-react';
import { defineCardComponent } from '@tylertech/forge';
defineCardComponent();
import { ForgeButton } from '@tylertech/forge-react';
import { defineButtonComponent } from '@tylertech/forge';
defineButtonComponent();
import { FileDown, FileText, File } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface DocumentsViewerProps {
  documents: Document[];
  incidentId: string;
}

export function DocumentsViewer({ documents, incidentId }: DocumentsViewerProps) {
  const handleDownload = (doc: Document) => {
    toast.success('Download started', {
      description: `Downloading ${doc.name}...`,
    });
    
    // In a real app, this would trigger a download
    console.log('Downloading:', doc.name);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FileText className="h-8 w-8" style={{ color: 'var(--brand-blue-medium)' }} />;
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return <File className="h-8 w-8" style={{ color: 'var(--brand-olive-dark)' }} />;
    } else {
      return <File className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} />;
    }
  };

  return (
    <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
      <div style={{ padding: 'var(--forge-spacing-medium)' }}>
        <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
          Incident Documents
        </h3>
        <p className="forge-typography--body2" style={{ fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)', margin: 0, fontFamily: 'Roboto, sans-serif' }}>
          {documents.length} document{documents.length !== 1 ? 's' : ''} attached to this incident
        </p>
        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--forge-spacing-medium)',
                padding: 'var(--forge-spacing-medium)',
                borderRadius: 'var(--forge-shape-medium)',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              className="hover:shadow-md"
              onClick={() => handleDownload(doc)}
            >
              {/* File Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--forge-shape-small)',
                  background: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getFileIcon(doc.type)}
              </div>

              {/* Document Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'Roboto, sans-serif',
                    color: 'var(--foreground)',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.name}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--muted-foreground)',
                    fontFamily: 'Roboto, sans-serif',
                    marginBottom: '2px',
                  }}
                >
                  {doc.size}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted-foreground)',
                    fontFamily: 'Roboto, sans-serif',
                  }}
                >
                  Uploaded by {doc.uploadedBy} • {doc.uploadedAt}
                </div>
              </div>

              {/* Download Button */}
              <ForgeButton
                variant="outlined"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(doc);
                }}
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download
              </ForgeButton>
            </div>
          ))}
        </div>

        {/* Upload Section (Optional - for future enhancement) */}
        <div
          style={{
            marginTop: 'var(--forge-spacing-large)',
            padding: 'var(--forge-spacing-large)',
            borderRadius: 'var(--forge-shape-medium)',
            border: '2px dashed var(--border)',
            background: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--muted-foreground)',
              fontFamily: 'Roboto, sans-serif',
              marginBottom: 'var(--forge-spacing-small)',
            }}
          >
            Need to add more documents?
          </div>
          <ForgeButton
            variant="outlined"
            onClick={() => {
              toast.info('Upload functionality', {
                description: 'Document upload feature coming soon.',
              });
            }}
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: 'var(--text-sm)',
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Upload Document
          </ForgeButton>
        </div>
        </div>
      </div>
    </ForgeCard>
  );
}
