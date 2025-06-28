// mockChatData.js
export const mockChatThreads = [
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
  
  export const mockChatMessages = {
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
  
  export const getMockThreads = () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockChatThreads
        });
      }, 500); // Simulate network delay
    });
  };
  
  export const getMockMessages = (threadId) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockChatMessages[threadId] || []
        });
      }, 500);
    });
  };