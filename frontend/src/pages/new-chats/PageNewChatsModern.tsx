import React, { useEffect, useRef, useState } from "react";
import "./pageNewChats.css";
import Markdown from "react-markdown";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  useGetChats,
  useGetChatsHistory,
  useGetChatsHistoryList,
} from "../../hooks/mutations/chats/chats.mutate";
import { Field, Form } from "react-final-form";
import { useNavigate, useParams } from "react-router-dom";
import { Login as LoginIcon } from "@mui/icons-material";
import SendIcon from "@mui/icons-material/Send";
import { useAuth } from "../../contexts/AuthContext";

const randomId = () => Math.random().toString(36).substr(2, 9);

/**
 * Modern Chat Page Component
 * 
 * Provides a responsive chat interface with:
 * - Proper layout that prevents input field from being hidden
 * - Sidebar for authenticated users with chat history
 * - Fixed input area at the bottom
 * - Scrollable message area
 */
export const PageNewChatsModern = () => {
  const navigation = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [historyListData, setHistoryListData] = useState<any[]>([]);
  const params = useParams();
  const [typing, setTyping] = useState(false);
  const endChatRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();

  const { mutate: chat } = useGetChats();
  const { mutate: history } = useGetChatsHistory();
  const { mutate: historyList } = useGetChatsHistoryList();

  const removeAllTags = (input: string): string => {
    return input.replace(/<[^>]*>/g, "");
  };

  const navigateToNewChat = () => {
    navigation("/chats");
    setChats([]);
  };

  useEffect(() => {
    // Only fetch history if user is authenticated
    if (isAuthenticated) {
      fetchHistoryList();
      fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchHistory = () => {
    // Only fetch history for authenticated users
    if (!isAuthenticated) return;
    
    history(
      { id: params.id },
      {
        onSuccess: (data: any) => {
          // Ensure data is always an array
          const chatData = Array.isArray(data) ? data : (data?.messages || []);
          setChats(chatData);
          setTimeout(() => {
            endChatRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        },
        onError: (error: any) => {
          console.error("Error fetching chat history:", error);
        },
      }
    );
  };

  const fetchHistoryList = () => {
    // Only fetch history list for authenticated users
    if (!isAuthenticated) return;
    
    historyList(undefined, {
      onSuccess: (data: any) => {
        console.log("History List:", data);
        setHistoryListData(data || []);
      },
      onError: (error: any) => {
        console.error("Error fetching history list:", error);
      },
    });
  };

  const onSubmit = async (value: any) => {
    try {
      if (value.chat) {
        setTimeout(() => {
          endChatRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        
        // For anonymous users, don't navigate to chat ID and don't save history
        if (isAuthenticated && params.id === undefined) {
          navigation(`/chats/` + randomId());
        }

        setTyping(true);

        const userMessage = {
          role: "user",
          content: value.chat,
          timestamp: new Date().toISOString(),
        };

        setChats(prev => [...prev, userMessage]);

        chat(
          {
            chat: value.chat,
            id: params.id,
            sessionId: params.id,
          },
          {
            onSuccess: (response: any) => {
              setTyping(false);
              const aiMessage = {
                role: "assistant",
                content: response.message || response.response || "Sorry, I couldn't process your request.",
                timestamp: new Date().toISOString(),
              };
              setChats(prev => [...prev, aiMessage]);
              
              setTimeout(() => {
                endChatRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            },
            onError: (error: any) => {
              setTyping(false);
              console.error("Chat error:", error);
              const errorMessage = {
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
                timestamp: new Date().toISOString(),
              };
              setChats(prev => [...prev, errorMessage]);
            },
          }
        );
      }
    } catch (error) {
      setTyping(false);
      console.error("Submit error:", error);
    }
  };

  // Safe setter to ensure chats is always an array
  const safeSetChats = (value: any[] | ((prev: any[]) => any[])) => {
    if (typeof value === 'function') {
      setChats(prev => {
        const newValue = value(Array.isArray(prev) ? prev : []);
        return Array.isArray(newValue) ? newValue : [];
      });
    } else {
      setChats(Array.isArray(value) ? value : []);
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      {/* Chat Header for Authenticated Users */}
      {isAuthenticated && (
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Welcome, {user?.username}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You are chatting as {user?.role}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Unauthenticated User Info */}
      {!isAuthenticated && (
        <Box
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
              Welcome to Hotel AI Chat
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You're chatting as a guest. Login to access full features and save your conversations.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={() => navigation('/login')}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            Login
          </Button>
        </Box>
      )}

      {/* Main Chat Container */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar - Only show for authenticated users */}
        {isAuthenticated && (
          <Box
            sx={{
              width: '300px',
              minWidth: '300px',
              background: alpha(theme.palette.background.paper, 0.6),
              borderRight: `1px solid ${theme.palette.divider}`,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={navigateToNewChat}
              sx={{
                mb: 2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              New Chat
            </Button>
            
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, flexShrink: 0 }}>
              Chat History
            </Typography>
            
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {historyListData.map((item, index) => (
                <Box
                  key={index}
                  onClick={() => navigation(`/chats/${item.id || item.session_id}`)}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    cursor: "pointer",
                    background: params.id === (item.id || item.session_id)
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    border: params.id === (item.id || item.session_id)
                      ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                      : '1px solid transparent',
                    "&:hover": {
                      background: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.title || `Chat ${index + 1}`}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.lastMessage || "No messages"}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Main Chat Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: 'hidden',
            p: 2,
          }}
        >
          {/* Chat Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              mb: 2,
              p: 2,
              background: alpha(theme.palette.background.paper, 0.4),
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {chats.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '300px',
                  textAlign: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Start a conversation
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Ask me anything about hotel services, amenities, or booking information.
                </Typography>
              </Box>
            )}

            {Array.isArray(chats) && chats.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    borderRadius: 2,
                    background: message.role === 'user'
                      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                      : alpha(theme.palette.background.paper, 0.8),
                    color: message.role === 'user' ? 'white' : theme.palette.text.primary,
                    border: message.role === 'user'
                      ? 'none'
                      : `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {message.role === 'user' ? (
                    <Typography variant="body1">
                      {removeAllTags(message.content)}
                    </Typography>
                  ) : (
                    <Markdown>{message.content}</Markdown>
                  )}
                </Box>
              </Box>
            ))}

            {typing && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    AI is typing...
                  </Typography>
                </Box>
              </Box>
            )}
            <div ref={endChatRef} />
          </Box>

          {/* Message Input - Fixed at bottom */}
          <Box sx={{ flexShrink: 0 }}>
            <Form onSubmit={onSubmit}>
              {({ handleSubmit, values, form }) => {
                const isDisabled = !values.chat || values.chat.trim() === "";
                const clearInput = (e: any) => {
                  handleSubmit(e);
                  form.reset();
                };
                return (
                  <form onSubmit={clearInput}>
                    <Field name="chat">
                      {(props: any) => (
                        <TextField
                          {...props.input}
                          placeholder={isAuthenticated 
                            ? "Type your message..."
                            : "Ask about hotel services, amenities, or booking info..."
                          }
                          variant="outlined"
                          fullWidth
                          multiline
                          maxRows={4}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 3,
                              backgroundColor: alpha(theme.palette.background.paper, 0.8),
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${theme.palette.divider}`,
                              "&:hover": {
                                border: `1px solid ${theme.palette.primary.main}`,
                              },
                              "&.Mui-focused": {
                                border: `2px solid ${theme.palette.primary.main}`,
                              },
                            },
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  type="submit"
                                  disabled={isDisabled || typing}
                                  sx={{
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                    color: 'white',
                                    width: 40,
                                    height: 40,
                                    "&:hover": {
                                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                    },
                                    "&.Mui-disabled": {
                                      background: theme.palette.grey[300],
                                      color: theme.palette.grey[500],
                                    },
                                  }}
                                >
                                  <SendIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                  </form>
                );
              }}
            </Form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PageNewChatsModern;
