import React, { useMemo, useRef, useState } from 'react';
import { ORG_TREE, OrgNode, checkedLeafNames } from '../../data/organizations';

// The organization selector, copied from how Student Transportation already does
// it in tyler.tms.slideOutMenuEx.js rather than invented here:
//
//   - a hierarchical checkbox tree, not a flat list or a single-select dropdown
//   - checkChildren, so ticking a district ticks every school under it
//   - orgs outside the user's claims render disabled, not hidden
//   - the selection is saved explicitly behind a confirm, not on each click
//
// It lives in the navigation drawer, which is where ST puts it, and it renders
// only on a multi-district site.

function cloneWithChildren(node: OrgNode, checked: boolean): OrgNode {
  return {
    ...node,
    checked: node.available ? checked : node.checked,
    children: node.children?.map(c => cloneWithChildren(c, checked)),
  };
}

function setChecked(nodes: OrgNode[], orgKey: string, checked: boolean): OrgNode[] {
  return nodes.map(n => {
    if (n.orgKey === orgKey) return cloneWithChildren(n, checked);
    return { ...n, children: n.children ? setChecked(n.children, orgKey, checked) : undefined };
  });
}

export function OrgSelector() {
  const [tree, setTree] = useState<OrgNode[]>(ORG_TREE);
  const [saved, setSaved] = useState<OrgNode[]>(ORG_TREE);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ GLOBAL: true, RVC: true });
  const confirmRef = useRef<HTMLElement>(null);

  const dirty = useMemo(() => JSON.stringify(tree) !== JSON.stringify(saved), [tree, saved]);
  const scope = checkedLeafNames(saved);

  const rows: React.ReactNode[] = [];
  const walk = (nodes: OrgNode[], depth: number) => {
    nodes.forEach(node => {
      const kids = node.children ?? [];
      const open = expanded[node.orgKey] ?? false;
      rows.push(
        <div
          key={node.orgKey}
          className="flex items-center"
          style={{
            gap: '6px',
            padding: '3px 0 3px ' + (depth * 16 + 4) + 'px',
            fontFamily: 'var(--forge-font-family)',
            fontSize: 'var(--forge-font-size-sm)',
            color: node.available ? 'var(--forge-theme-text-high)' : 'var(--forge-theme-text-low)',
          }}
        >
          {kids.length ? (
            <button
              type="button"
              onClick={() => setExpanded(e => ({ ...e, [node.orgKey]: !open }))}
              aria-label={open ? 'Collapse' : 'Expand'}
              style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, lineHeight: 1, color: 'inherit' }}
            >
              {/* @ts-ignore */}
              <forge-icon name={open ? 'chevron_down' : 'chevron_right'} style={{ fontSize: '18px' }}></forge-icon>
            </button>
          ) : (
            <span style={{ width: '18px', flex: '0 0 18px' }} />
          )}
          <input
            type="checkbox"
            checked={node.checked}
            disabled={!node.available}
            onChange={(e) => setTree(t => setChecked(t, node.orgKey, e.target.checked))}
            style={{ cursor: node.available ? 'pointer' : 'not-allowed', flex: '0 0 auto' }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.text}
          </span>
        </div>,
      );
      if (open) walk(kids, depth + 1);
    });
  };
  walk(tree, 0);

  return (
    <div style={{ padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)' }}>
      <div
        className="forge-typography--label1"
        style={{ color: 'var(--forge-theme-text-low)', marginBottom: '4px' }}
      >
        Organizations
      </div>

      {/* The active scope, readable without opening anything, so a coordinator
          knows which districts a count covers before reading it. */}
      <div
        style={{
          fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)',
          color: 'var(--forge-theme-text-medium)', marginBottom: '6px',
        }}
      >
        {scope.length ? scope.join(', ') : 'Nothing selected'}
      </div>

      <div style={{ maxHeight: '190px', overflowY: 'auto', marginBottom: '6px' }}>{rows}</div>

      {/* @ts-ignore */}
      <forge-button variant="outlined" disabled={!dirty} onClick={() => confirmRef.current?.setAttribute('open', '')}>
        Save
      </forge-button>

      {/* Saving is confirmed rather than applied per click, matching ST. */}
      {/* @ts-ignore */}
      <forge-dialog ref={confirmRef}>
        <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '380px' }}>
          <div className="forge-typography--heading4" style={{ marginBottom: 'var(--forge-spacing-small)' }}>
            Change organizations
          </div>
          <p style={{ fontFamily: 'var(--forge-font-family)', lineHeight: 1.6, margin: 0 }}>
            Changing your organizations reloads incidents, the dashboard, reports and
            communications for the new scope. Any unsaved work on screen is lost.
          </p>
          <div className="flex" style={{ gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-large)', justifyContent: 'flex-end' }}>
            {/* @ts-ignore */}
            <forge-button variant="outlined" onClick={() => { setTree(saved); confirmRef.current?.removeAttribute('open'); }}>
              No
            </forge-button>
            {/* @ts-ignore */}
            <forge-button variant="raised" onClick={() => { setSaved(tree); confirmRef.current?.removeAttribute('open'); }}>
              Yes
            </forge-button>
          </div>
        </div>
      </forge-dialog>
    </div>
  );
}
