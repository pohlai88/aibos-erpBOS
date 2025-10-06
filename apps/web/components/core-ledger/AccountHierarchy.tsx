'use client';

import { useState, useCallback } from 'react';
import { useAccountHierarchy, useValidateReparent, useReparentAccount, AccountNode } from '@/hooks/useAccounts';
import { Card, Badge, Button, Toast } from 'aibos-ui';

interface AccountHierarchyProps {
  companyId?: string;
}

interface DragState {
  draggedNode: AccountNode | null;
  dragOverNode: AccountNode | null;
  dragPosition: 'above' | 'below' | 'inside' | null;
}

export function AccountHierarchy({ companyId }: AccountHierarchyProps) {
  const { data: hierarchyData, isLoading, error, refetch } = useAccountHierarchy(companyId);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<DragState>({
    draggedNode: null,
    dragOverNode: null,
    dragPosition: null,
  });
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const validateReparent = useValidateReparent();
  const reparentAccount = useReparentAccount();

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      Asset: 'badge-ok',
      Liability: 'badge-warn',
      Equity: 'badge-info',
      Income: 'badge-ok',
      Expense: 'badge-err',
    };
    return badges[type as keyof typeof badges] || 'badge-info';
  };

  const getNormalBalanceBadge = (balance: string) => {
    return balance === 'D' ? 'badge-ok' : 'badge-warn';
  };

  const handleDragStart = useCallback((e: React.DragEvent, node: AccountNode) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
    setDragState(prev => ({ ...prev, draggedNode: node }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, node: AccountNode) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'above' | 'below' | 'inside' = 'inside';
    if (y < height * 0.25) {
      position = 'above';
    } else if (y > height * 0.75) {
      position = 'below';
    }

    setDragState(prev => ({
      ...prev,
      dragOverNode: node,
      dragPosition: position,
    }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dragOverNode: null,
      dragPosition: null,
    }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetNode: AccountNode) => {
    e.preventDefault();
    
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    const draggedNode = dragState.draggedNode;

    if (!draggedNode || draggedNode.id === targetNode.id) {
      setDragState({ draggedNode: null, dragOverNode: null, dragPosition: null });
      return;
    }

    // Determine new parent based on drop position
    let newParentCode: string | null = null;
    
    if (dragState.dragPosition === 'inside') {
      // Drop inside target node - make target the parent
      newParentCode = targetNode.code;
    } else if (dragState.dragPosition === 'above' || dragState.dragPosition === 'below') {
      // Drop above/below target node - use target's parent
      newParentCode = targetNode.parentCode || null;
    }

    try {
      // Validate the reparent operation
      const validation = await validateReparent.mutateAsync({
        accountId: draggedNode.id,
        newParentCode,
      });

      if (!validation.valid) {
        setShowToast({ message: validation.message, type: 'error' });
        return;
      }

      // Perform the reparent operation
      await reparentAccount.mutateAsync({
        accountId: draggedNode.id,
        newParentCode,
      });

      setShowToast({ 
        message: `Account ${draggedNode.code} moved successfully`, 
        type: 'success' 
      });

      // Refresh the hierarchy
      refetch();
    } catch (error) {
      setShowToast({ 
        message: `Failed to move account: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    }

    setDragState({ draggedNode: null, dragOverNode: null, dragPosition: null });
  }, [dragState, validateReparent, reparentAccount, refetch]);

  const getDragStyles = (node: AccountNode) => {
    if (dragState.dragOverNode?.id === node.id) {
      switch (dragState.dragPosition) {
        case 'above':
          return 'border-t-2 border-brand bg-brand/5';
        case 'below':
          return 'border-b-2 border-brand bg-brand/5';
        case 'inside':
          return 'border-2 border-brand bg-brand/10';
        default:
          return '';
      }
    }
    return '';
  };

  const renderNode = (node: AccountNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isDragging = dragState.draggedNode?.id === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          className={`flex items-center p-2 hover:bg-accent/5 rounded transition-colors cursor-move ${
            depth > 0 ? 'ml-4' : ''
          } ${getDragStyles(node)} ${isDragging ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${depth * 1.5}rem` }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(node.id)}
                className="p-1 h-6 w-6 mr-2"
              >
                {isExpanded ? '▼' : '▶'}
              </Button>
            ) : (
              <div className="w-6 mr-2" />
            )}

            <code className="bg-chip px-2 py-1 rounded text-sm font-mono mr-3 flex-shrink-0">
              {node.code}
            </code>

            <span className="font-medium truncate mr-3">{node.name}</span>

            <div className="flex gap-1 flex-shrink-0">
              <Badge className={`${getTypeBadge(node.type)} text-xs`}>
                {node.type}
              </Badge>
              <Badge className={`${getNormalBalanceBadge(node.normalBalance)} text-xs`}>
                {node.normalBalance === 'D' ? 'Debit' : 'Credit'}
              </Badge>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="premium-card p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-muted">Loading account hierarchy...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="premium-card p-6">
        <div className="text-center text-red-500">
          <p>Error loading hierarchy: {error.message}</p>
        </div>
      </Card>
    );
  }

  const hierarchy = hierarchyData?.hierarchy || [];

  return (
    <>
      <Card className="premium-card">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Account Hierarchy</h3>
              <p className="text-sm text-muted">
                {hierarchyData?.total || 0} accounts total • Drag to reorganize
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedNodes(new Set())}
                className="text-xs"
              >
                Collapse All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allIds = new Set<string>();
                  const collectIds = (nodes: AccountNode[]) => {
                    nodes.forEach(node => {
                      if (node.children.length > 0) {
                        allIds.add(node.id);
                        collectIds(node.children);
                      }
                    });
                  };
                  collectIds(hierarchy);
                  setExpandedNodes(allIds);
                }}
                className="text-xs"
              >
                Expand All
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {hierarchy.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted">No accounts found</p>
            </div>
          ) : (
            <div className="p-2">
              {hierarchy.map((node: AccountNode) => renderNode(node))}
            </div>
          )}
        </div>
      </Card>

      {showToast && (
        <Toast
          open={!!showToast}
          onOpenChange={() => setShowToast(null)}
          type={showToast.type}
        >
          {showToast.message}
        </Toast>
      )}
    </>
  );
}
