import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatPopup.css'; // We'll use the same CSS as customer chat

const BASE_URL = "http://localhost:3000/api/halls";

const OwnerChatPopup = ({ onClose }) => {
  const [chatThreads, setChatThreads] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatThreadsError, setChatThreadsError] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeRecipient, setActiveRecipient] = useState(null);
  const messagesEndRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchChatThreads = async () => {
    try {
      setLoadingChats(true);
      setChatThreadsError(null);
      const response = await axios.get(
        `${BASE_URL}/chats/thread`,
        getAuthHeaders()
      );
      
      if (response.data && Array.isArray(response.data)) {
        setChatThreads(response.data);
      } else {
        setChatThreads([]);
      }
    } catch (err) {
      setChatThreadsError(err.message);
      console.error("Error fetching chat threads:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchChatMessages = async (threadId, recipientName) => {
    try {
      setLoadingMessages(true);
      setMessagesError(null);
      const response = await axios.get(
        `${BASE_URL}/chats/${threadId}`,
        getAuthHeaders()
      );
      setChatMessages(response.data || []);
      setActiveChat(threadId);
      setActiveRecipient(recipientName);
    } catch (err) {
      setMessagesError(err.message);
      console.error("Error fetching chat messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const tempId = Date.now();
    
    try {
      const tempMessage = {
        id: tempId,
        sender_type: 'owner',
        message: newMessage,
        sent_at: new Date().toISOString(),
        read_at: null
      };
      
      setChatMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      const response = await axios.post(
        `${BASE_URL}/chats/${activeChat}/reply`,
        { message: newMessage },
        getAuthHeaders()
      );
      
      setChatMessages(prev => 
        prev.map(msg => msg.id === tempId ? {
          ...response.data,
          id: response.data.id
        } : msg)
      );
    } catch (err) {
      console.error("Error sending message:", err);
      setChatMessages(prev => prev.filter(msg => msg.id !== tempId));
      setMessagesError("Failed to send message. Please try again.");
    }
  };

  useEffect(() => {
    fetchChatThreads();
  }, []);

  return (
    <div className="chat-popup">
      <div className="chat-popup-header">
        {activeChat ? (
          <>
            <button 
              className="back-button"
              onClick={() => {
                setActiveChat(null);
                setChatMessages([]);
                setActiveRecipient(null);
              }}
            >
              &larr;
            </button>
            <h3>{activeRecipient || 'Chat'}</h3>
          </>
        ) : (
          <h3>Your Chats</h3>
        )}
        <button 
          className="close-chat-popup" 
          onClick={onClose}
        >
          ×
        </button>
      </div>
      
      {activeChat ? (
        <div className="chat-messages-container">
          <div className="messages-list">
            {loadingMessages ? (
              <div className="loading-messages">Loading messages...</div>
            ) : messagesError ? (
              <div className="messages-error">{messagesError}</div>
            ) : chatMessages.length === 0 ? (
              <div className="no-messages">No messages yet. Start the conversation!</div>
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.sender_type === 'owner' ? 'sent' : 'received'}`}
                  >
                    <p>{msg.message}</p>
                    <span className="message-time">
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.sender_type === 'owner' && msg.read_at && (
                      <span className="read-indicator">✓ Read</span>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-threads">
          {loadingChats ? (
            <div className="loading-chats">Loading chats...</div>
          ) : chatThreadsError ? (
            <div className="chat-error">{chatThreadsError}</div>
          ) : chatThreads.length === 0 ? (
            <div className="no-chats">You don't have any chats yet</div>
          ) : (
            chatThreads.map(thread => (
              <div 
                key={thread.id} 
                className={`chat-thread ${thread.unread_count > 0 ? 'unread' : ''}`}
                onClick={() => fetchChatMessages(thread.id, thread.customer_name)}
              >
                <div className="chat-recipient">
                  {thread.customer_name}
                  {thread.unread_count > 0 && (
                    <span className="unread-badge">{thread.unread_count}</span>
                  )}
                </div>
                <div className="chat-preview">
                  <p>{thread.last_message}</p>
                  <span>{new Date(thread.last_message_time).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerChatPopup;