import React, { useState, useEffect, useRef } from 'react';
import './ChatPopup.css';

const ChatPopup = ({ onClose }) => {
  const [chatThreads, setChatThreads] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeRecipient, setActiveRecipient] = useState(null);
  const messagesEndRef = useRef(null);

  // Mock data for chat threads
  const mockThreads = [
    {
      id: 1,
      recipient_name: "Grand Palace Hall",
      last_message: "Hi, we'd like to book your venue for Saturday",
      last_message_time: "2023-10-15T14:30:00Z",
      unread_count: 2,
      recipient_avatar: "/hall1.jpg"
    },
    {
      id: 2,
      recipient_name: "Royal Gardens",
      last_message: "Thank you for your inquiry!",
      last_message_time: "2023-10-14T09:15:00Z",
      unread_count: 0,
      recipient_avatar: "/hall2.jpg"
    },
    {
      id: 3,
      recipient_name: "Ocean View Events",
      last_message: "The deposit has been received",
      last_message_time: "2023-10-12T16:45:00Z",
      unread_count: 1,
      recipient_avatar: "/hall3.jpg"
    }
  ];

  // Mock data for messages
  const mockMessages = {
    1: [
      {
        id: 101,
        sender_type: "customer",
        message: "Hi, we're interested in booking your hall for a wedding",
        sent_at: "2023-10-15T10:30:00Z",
        read_at: "2023-10-15T10:35:00Z"
      },
      {
        id: 102,
        sender_type: "owner",
        message: "Hello! We'd be happy to host your wedding. What date are you considering?",
        sent_at: "2023-10-15T11:15:00Z",
        read_at: null
      },
      {
        id: 103,
        sender_type: "customer",
        message: "We're looking at Saturday, November 25th",
        sent_at: "2023-10-15T14:30:00Z",
        read_at: null
      }
    ],
    2: [
      {
        id: 201,
        sender_type: "customer",
        message: "Do you have availability for December 10th?",
        sent_at: "2023-10-14T08:30:00Z",
        read_at: "2023-10-14T08:45:00Z"
      },
      {
        id: 202,
        sender_type: "owner",
        message: "Thank you for your inquiry! Yes, we're available that date.",
        sent_at: "2023-10-14T09:15:00Z",
        read_at: null
      }
    ],
    3: [
      {
        id: 301,
        sender_type: "customer",
        message: "We've sent the deposit as discussed",
        sent_at: "2023-10-12T15:30:00Z",
        read_at: "2023-10-12T15:45:00Z"
      },
      {
        id: 302,
        sender_type: "owner",
        message: "The deposit has been received, thank you!",
        sent_at: "2023-10-12T16:45:00Z",
        read_at: null
      }
    ]
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchChatThreads = async () => {
    setLoadingChats(true);
    // Simulate API call
    setTimeout(() => {
      setChatThreads(mockThreads);
      setLoadingChats(false);
    }, 500);
  };

  const fetchChatMessages = async (threadId, recipientName) => {
    setLoadingMessages(true);
    // Simulate API call
    setTimeout(() => {
      setChatMessages(mockMessages[threadId] || []);
      setActiveChat(threadId);
      setActiveRecipient(recipientName);
      setLoadingMessages(false);
    }, 500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      sender_type: 'customer',
      message: newMessage,
      sent_at: new Date().toISOString(),
      read_at: null
    };
    
    // Optimistic update
    setChatMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Simulate sending to server
    setTimeout(() => {
      // In a real app, you would update the message with the server response
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, id: tempId + 1 } : msg
      ));
    }, 300);
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
            ) : chatMessages.length === 0 ? (
              <div className="no-messages">No messages yet. Start the conversation!</div>
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.sender_type === 'customer' ? 'sent' : 'received'}`}
                  >
                    <p>{msg.message}</p>
                    <span className="message-time">
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.sender_type === 'customer' && msg.read_at && (
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
          ) : chatThreads.length === 0 ? (
            <div className="no-chats">You don't have any chats yet</div>
          ) : (
            chatThreads.map(thread => (
              <div 
                key={thread.id} 
                className={`chat-thread ${thread.unread_count > 0 ? 'unread' : ''}`}
                onClick={() => fetchChatMessages(thread.id, thread.recipient_name)}
              >
                <div className="chat-recipient">
                  {thread.recipient_name}
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

export default ChatPopup;