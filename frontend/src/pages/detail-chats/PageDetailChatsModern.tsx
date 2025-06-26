import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Chat,
  Search,
  Visibility,
  Delete,
  FilterList,
  Download
} from '@mui/icons-material';
import { useChatHistory } from '../../hooks/api';
import {
  PageContainer,
  PageHeader,
  InfoCard,
  PageLoading,
  ErrorState
} from '../../components/common';
import {
  formatDateTime,
  formatRelativeTime,
  truncateText,
  formatDuration
} from '../../utils';

interface ChatSession {
  id: string;
  session_id: string;
  user_message?: string;
  bot_response?: string;
  timestamp: string;
  message_count?: number;
  duration?: number;
  user_type?: string;
}

// Chat session row component
const ChatSessionRow: React.FC<{
  session: ChatSession;
  onView: (session: ChatSession) => void;
  onDelete: (sessionId: string) => void;
}> = ({ session, onView, onDelete }) => (
  <TableRow sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
    <TableCell>
      <Typography variant="body2" fontWeight="medium">
        {session.session_id?.substring(0, 8)}...
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatRelativeTime(session.timestamp)}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2" sx={{ maxWidth: 300 }}>
        {session.user_message ? truncateText(session.user_message, 100) : 'No message'}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2" sx={{ maxWidth: 300 }}>
        {session.bot_response ? truncateText(session.bot_response, 100) : 'No response'}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">
        {formatDateTime(session.timestamp)}
      </Typography>
    </TableCell>
    <TableCell>
      <Chip
        label={session.user_type || 'Guest'}
        color={session.user_type === 'authenticated' ? 'primary' : 'default'}
        size="small"
      />
    </TableCell>
    <TableCell>
      <Box display="flex" gap={0.5}>
        <Tooltip title="View details">
          <IconButton
            size="small"
            onClick={() => onView(session)}
            color="primary"
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete session">
          <IconButton
            size="small"
            onClick={() => onDelete(session.session_id)}
            color="error"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
  </TableRow>
);

// Chat details dialog
const ChatDetailsDialog: React.FC<{
  open: boolean;
  session: ChatSession | null;
  onClose: () => void;
}> = ({ open, session, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>
      <Typography variant="h6">
        Chat Session Details
      </Typography>
    </DialogTitle>
    <DialogContent>
      {session && (
        <Box sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Session ID
            </Typography>
            <Typography variant="body1" fontFamily="monospace">
              {session.session_id}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Timestamp
            </Typography>
            <Typography variant="body1">
              {formatDateTime(session.timestamp)}
            </Typography>
          </Box>

          {session.user_message && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                User Message
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2">
                  {session.user_message}
                </Typography>
              </Paper>
            </Box>
          )}

          {session.bot_response && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Bot Response
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'primary.50' }}>
                <Typography variant="body2">
                  {session.bot_response}
                </Typography>
              </Paper>
            </Box>
          )}

          {session.message_count && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Message Count
              </Typography>
              <Typography variant="body1">
                {session.message_count} messages
              </Typography>
            </Box>
          )}

          {session.duration && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Session Duration
              </Typography>
              <Typography variant="body1">
                {formatDuration(session.duration)}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export const PageDetailChatsModern: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // API hooks
  const { 
    data: chatHistory, 
    isLoading, 
    error 
  } = useChatHistory();

  // Process chat data
  const sessions = useMemo(() => {
    if (!chatHistory) return [];
    
    // If chatHistory is an array of individual messages, group by session
    if (Array.isArray(chatHistory)) {
      const sessionMap = new Map<string, ChatSession>();
      
      chatHistory.forEach((chat: any) => {
        const sessionId = chat.session_id || chat.id;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            id: chat.id,
            session_id: sessionId,
            user_message: chat.user_message || chat.content,
            bot_response: chat.bot_response || chat.response,
            timestamp: chat.timestamp || chat.created_at,
            message_count: 1,
            user_type: chat.user_type || 'guest'
          });
        } else {
          const existing = sessionMap.get(sessionId)!;
          existing.message_count = (existing.message_count || 0) + 1;
        }
      });
      
      return Array.from(sessionMap.values());
    }
    
    return chatHistory.data || [];
  }, [chatHistory]);

  // Filter sessions based on search
  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions;
    
    return sessions.filter(session =>
      session.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.bot_response?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  const handleViewDetails = (session: ChatSession) => {
    setSelectedSession(session);
    setDetailsOpen(true);
  };
  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      try {
        // TODO: Implement delete session API call
        console.log('Delete session:', sessionId);
        // For now, just show a message
        alert('Delete functionality would be implemented here');
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredSessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <PageLoading message="Loading chat history..." />;
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          error={error}
          title="Failed to Load Chat History"
          fullPage
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Chat History"
        subtitle="View and manage detailed chat conversations and sessions"
        icon={<Chat sx={{ fontSize: '2rem', color: 'primary.main' }} />}
        actions={
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportData}
            disabled={filteredSessions.length === 0}
          >
            Export Data
          </Button>
        }
      />

      {/* Search and Filters */}
      <InfoCard
        title="Search & Filter"
        icon={<FilterList color="primary" />}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search by session ID, user message, or bot response..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </InfoCard>

      {/* Chat Sessions Table */}
      <Paper elevation={2} sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell><strong>Session ID</strong></TableCell>
                <TableCell><strong>User Message</strong></TableCell>
                <TableCell><strong>Bot Response</strong></TableCell>
                <TableCell><strong>Timestamp</strong></TableCell>
                <TableCell><strong>User Type</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSessions.map((session) => (
                <ChatSessionRow
                  key={session.id || session.session_id}
                  session={session}
                  onView={handleViewDetails}
                  onDelete={handleDeleteSession}
                />
              ))}
              {filteredSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">
                      {searchTerm ? 'No chat sessions found matching your search' : 'No chat sessions available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Chat Details Dialog */}
      <ChatDetailsDialog
        open={detailsOpen}
        session={selectedSession}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedSession(null);
        }}
      />
    </PageContainer>
  );
};

PageDetailChatsModern.displayName = 'PageDetailChatsModern';
