import React, { useEffect, useRef } from "react";
import { useState } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import "./pageNewChats.css";
import Markdown from "react-markdown";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import {
  useGetChats,
  useGetChatsHistory,
  useGetChatsHistoryList,
} from "../../hooks/mutations/chats/chats.mutate";
import { Field, Form } from "react-final-form";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpward } from "@mui/icons-material";
import SendIcon from "@mui/icons-material/Send";

const randomId = () => Math.random().toString(36).substr(2, 9);
export const PageNewChats = () => {
  const navigation = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [historyListData, setHistoryListData] = useState<any[]>([]);
  const params = useParams();
  const [typing, setTyping] = useState(false);
  const endChatRef = useRef<HTMLDivElement>(null);

  const { mutate: chat } = useGetChats();
  const { mutate: history } = useGetChatsHistory();
  const { mutate: historyList } = useGetChatsHistoryList();

  const removeAllTags = (input: string): string => {
    return input.replace(/<[^>]*>/g, "");
  };

  useEffect(() => {
    fetchHistoryList();
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    history(
      { id: params.id },
      {
        onSuccess: (data: any) => {
          setChats(data);
          setTimeout(() => {
            endChatRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        },
      }
    );
  };

  const fetchHistoryList = () => {
    historyList(undefined, {
      onSuccess: (data: any) => {
        console.log("History List:", data);
        setHistoryListData(data);
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
        if (params.id === undefined) {
          navigation(`/chats/` + randomId());
        }
        if (chats.length === 0) {
          fetchHistoryList();
        }

        setChats((prev) => [
          ...prev,
          { role: "user", content: value?.chat, timestamp: new Date() },
        ]);
        setTyping(true);
        chat(
          {
            text: value.chat,
            session_id: params.id,
          },
          {
            onSuccess: (data: any) => {
              setTyping(false);
              setChats((prev) => [
                ...prev,
                { role: "bot", content: data?.reply, timestamp: new Date() },
              ]);
              fetchHistoryList();
            },
            onError: (error: any) => {
              setTyping(false);
              console.error("Error fetching chat response:", error);
            },
          }
        );
      }
    } catch (error) {
      console.error("POST error:", error);
    }
  };

  const navigateToNewChat = () => {
    navigation(`/chats/` + randomId());
    setTyping(false);
    setChats([]); // Clear the chat history when navigating to a new chat
  };

  return (
    <Box padding={3} width={"100%"} height="100%" display={"flex"}>
      <div className="chatPage">
        <Box
          padding={2}
          width={"100%"}
          bgcolor={"#878484"}
          display={"flex"}
          alignItems="center"
          justifyContent={"center"}
          color={"white"}
          boxShadow="0 2px 8px rgba(0,0,0,0.15)"
          borderRadius={"0.5rem"}
          sx={{ color: "white" }}
        >
          ChatBot
        </Box>
        <Box width={"100%"} height={"100%"} display={"flex"} maxHeight={"94%"}>
          <Box
            width={"20%"}
            borderRight={"1px solid #ccc"}
            height={"100%"}
            sx={{
              width: 300,
              overflowY: "auto", // Enable vertical scrolling
              scrollbarWidth: "thin", // Firefox support for custom scrollbar
              scrollbarColor: "transparent transparent", // Firefox support for scrollbar color

              // Webkit (for Chrome, Safari, Edge)
              "&::-webkit-scrollbar": {
                display: "none", // Hide scrollbar
              },
              "&:hover::-webkit-scrollbar": {
                display: "block", // Show scrollbar on hover
              },
            }}
          >
            <Box
              sx={{
                color: "black",
                cursor: "pointer",
                borderBottom: "1px solid #ccc",
                display: "flex",
                justifyContent: "end",
                padding: 1,
                overflowY: "auto", // Enable vertical scrolling
                scrollbarWidth: "thin", // Firefox support for custom scrollbar
                scrollbarColor: "transparent transparent", // Firefox support for scrollbar color

                // Webkit (for Chrome, Safari, Edge)
                "&::-webkit-scrollbar": {
                  display: "none", // Hide scrollbar
                },
                "&:hover::-webkit-scrollbar": {
                  display: "block", // Show scrollbar on hover
                },
              }}
            >
              <IconButton onClick={navigateToNewChat}>
                <AddIcon sx={{ color: "black" }} />
              </IconButton>
            </Box>
            <Box overflow={"scroll"} height={"90%"}>
              {historyListData.map((item, idx) => {
                const chatId = item.sessionID;
                // const isActive = params.id === "2e9d8ssb7";
                const isActive = params.id === chatId;
                return (
                  <Box
                    key={chatId}
                    display={"flex"}
                    gap={0.5}
                    flexDirection="column"
                    padding={2}
                    sx={{
                      color: "black",
                      cursor: "pointer",
                      borderBottom: "1px solid #ccc",
                      backgroundColor: isActive ? "#e0e0e0" : "transparent",
                      "&:hover": {
                        backgroundColor: "#9997971d",
                      },
                    }}
                    onClick={() => {
                      navigation(`/chats/${chatId}`);
                      fetchHistory();
                    }}
                  >
                    <Typography>{item.content.content}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box
            width={"80%"}
            height={"100%"}
            padding={3}
            display={"flex"}
            flexDirection="column"
            gap={2}
            justifyContent={"center"}
            sx={{
              overflowY: "auto", // Enable vertical scrolling
              scrollbarWidth: "thin", // Firefox support for custom scrollbar
              scrollbarColor: "transparent transparent", // Firefox support for scrollbar color

              "&::-webkit-scrollbar": {
                display: "none", // Hide scrollbar
              },
              "&:hover::-webkit-scrollbar": {
                display: "block", // Show scrollbar on hover
              },
            }}
          >
            <div className="wrapper">
              <div className="chat">
                {chats.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.role === "user" && (
                      <div className="message user">
                        {removeAllTags(item.content)}
                      </div>
                    )}
                    {item.role === "bot" && (
                      <div className="message">
                        <Markdown>{removeAllTags(item.content)}</Markdown>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {typing && (
                  <div className="message bot typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                )}
                <div className="endChat" ref={endChatRef}></div>
              </div>
            </div>
            <Box display={"flex"} justifyContent="center">
              <Form onSubmit={onSubmit}>
                {({ handleSubmit, values, form }) => {
                  const isDisabled = !values.chat || values.chat.trim() === "";
                  const clearInput = (e) => {
                    handleSubmit(e);
                    fetchHistoryList();
                    form.reset();
                  };
                  return (
                    <form className="newForm" onSubmit={clearInput}>
                      <Field name="chat">
                        {(props) => (
                          <Box width={"100%"}>
                            <TextField
                              name={props.input.name}
                              value={props.input.value}
                              onChange={props.input.onChange}
                              placeholder="ພິມຄຳຖາມຂອງທ່ານ..."
                              variant="outlined"
                              fullWidth
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "12px",
                                  backgroundColor: "#f5f5f5",
                                  paddingRight: "8px",
                                  "& fieldset": {
                                    borderColor: "#e0e0e0",
                                  },
                                  "&:hover fieldset": {
                                    borderColor: "#4caf50",
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#4caf50",
                                  },
                                },
                              }}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      disabled={isDisabled}
                                      type="submit"
                                      sx={{
                                        backgroundColor: "#4caf50",
                                        color: "white",
                                        width: "40px",
                                        height: "40px",
                                        "&:hover": {
                                          backgroundColor: "#45a049",
                                        },
                                        "&.Mui-disabled": {
                                          backgroundColor: "#4caf50",
                                          color: "white",
                                          opacity: 0.6,
                                        },
                                      }}
                                    >
                                      <SendIcon />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Box>
                        )}
                      </Field>
                    </form>
                  );
                }}
              </Form>
            </Box>
          </Box>
        </Box>
      </div>
    </Box>
  );
};
