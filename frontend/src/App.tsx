import { useCallback, useEffect, useMemo, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Chat } from "./components/Chat";
import { ChatList } from "./components/ChatList";
import { Layout } from "./components/Layout";
import { NewChat } from "./components/NewChat";
import { Chat as ChatType, useChatList } from "./hooks/useChatList";
import { useSchemas } from "./hooks/useSchemas";
import { useStreamState } from "./hooks/useStreamState";
import { useConfigList } from "./hooks/useConfigList";
import { Config } from "./components/Config";
import { MessageWithFiles } from "./utils/formTypes.ts";
import { TYPE_NAME } from "./constants.ts";
import { Login } from "./components/Login";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { configSchema, configDefaults } = useSchemas();
  const { chats, currentChat, createChat, enterChat } = useChatList();
  const { configs, currentConfig, saveConfig, enterConfig } = useConfigList();
  const { startStream, stopStream, stream } = useStreamState();
  const [isDocumentRetrievalActive, setIsDocumentRetrievalActive] =
    useState(false);
  const [isTokenValid, setIsTokenValid] = useState(() => {
    // get TokenValid value from localStorage
    const storedValue = localStorage.getItem('TokenValid');
    // change localStorage to boolean type
    return storedValue ? JSON.parse(storedValue) : false;
  });

  useEffect(() => {
    // if isTokenValid is changed, update localStorage
    localStorage.setItem('TokenValid', String(isTokenValid));
  }, [isTokenValid]);
  const [filteredChats, setFilteredChats] = useState([]);
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 发送请求验证token的有效性
        const response = await fetch('http://localhost:5173/verify-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`, // add token to request header
          },
        });
  
        if (response.ok) {
          // token is valid
          localStorage.setItem("TokenValid","true");
        } else {
          // token is not valid
          localStorage.setItem("TokenValid","false");
        }
      } catch (error) {
        // handle error
        console.error('Token verification error:', error);
        localStorage.setItem("TokenValid","false");
      }
    };
  
    if (isTokenValid) {
      verifyToken();
    }
  }, [isTokenValid]);
  useEffect(() => {
    let configurable = null;
    if (currentConfig) {
      configurable = currentConfig?.config?.configurable;
    }
    if (currentChat && configs) {
      const conf = configs.find(
        (c) => c.assistant_id === currentChat.assistant_id,
      );
      configurable = conf?.config?.configurable;
    }
    const agent_type = configurable?.["type"] as TYPE_NAME | null;
    if (agent_type === null || agent_type === "chatbot") {
      setIsDocumentRetrievalActive(false);
      return;
    }
    if (agent_type === "chat_retrieval") {
      setIsDocumentRetrievalActive(true);
      return;
    }
    const tools =
      (configurable?.["type==agent/tools"] as { name: string }[]) ?? [];
    setIsDocumentRetrievalActive(tools.some((t) => t.name === "Retrieval"));
    if (configs === null || chats === null) {
      setFilteredChats([]);
      return;
    }
    const filteredChats = chats.filter((c) =>
      configs.some((config) => config.assistant_id === c.assistant_id)
    );
    setFilteredChats(filteredChats);
  }, [chats,currentConfig, currentChat, configs,isTokenValid]);

  const startTurn = useCallback(
    async (message?: MessageWithFiles, chat: ChatType | null = currentChat) => {
      if (!chat) return;
      const config = configs?.find(
        (c) => c.assistant_id === chat.assistant_id,
      )?.config;
      if (!config) return;
      const files = message?.files || [];
      if (files.length > 0) {
        const formData = files.reduce((formData, file) => {
          formData.append("files", file);
          return formData;
        }, new FormData());
        formData.append(
          "config",
          JSON.stringify({ configurable: { thread_id: chat.thread_id } }),
        );
        await fetch(`/ingest`, {
          method: "POST",
          body: formData,
        });
      }
      await startStream(
        message
          ? [
              {
                content: message.message,
                additional_kwargs: {},
                type: "human",
                example: false,
              },
            ]
          : null,
        chat.assistant_id,
        chat.thread_id,
      );
    },
    [currentChat, startStream, configs],
  );

  const startChat = useCallback(
    async (message: MessageWithFiles) => {
      if (!currentConfig) return;
      const chat = await createChat(
        message.message,
        currentConfig.assistant_id,
      );
      return startTurn(message, chat);
    },
    [createChat, startTurn, currentConfig],
  );

  const selectChat = useCallback(
    async (id: string | null) => {
      if (currentChat) {
        stopStream?.(true);
      }
      enterChat(id);
      if (!id) {
        enterConfig(configs?.[0]?.assistant_id ?? null);
        window.scrollTo({ top: 0 });
      }
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
    },
    [enterChat, stopStream, sidebarOpen, currentChat, enterConfig, configs],
  );

  const selectConfig = useCallback(
    (id: string | null) => {
      enterConfig(id);
      enterChat(null);
    },
    [enterConfig, enterChat],
  );

  const content = currentChat ? (
    <Chat
      chat={currentChat}
      startStream={startTurn}
      stopStream={stopStream}
      stream={stream}
      isDocumentRetrievalActive={isDocumentRetrievalActive}
    />
  ) : currentConfig ? (
    <NewChat
      startChat={startChat}
      configSchema={configSchema}
      configDefaults={configDefaults}
      configs={configs}
      currentConfig={currentConfig}
      saveConfig={saveConfig}
      enterConfig={selectConfig}
      isDocumentRetrievalActive={isDocumentRetrievalActive}
    />
  ) : (
    <Config
      className="mb-6"
      config={currentConfig}
      configSchema={configSchema}
      configDefaults={configDefaults}
      saveConfig={saveConfig}
    />
  );

  const currentChatConfig = configs?.find(
    (c) => c.assistant_id === currentChat?.assistant_id,
  );
  if(isTokenValid){
    return (
      <div>{
        <Layout
        subtitle={
          currentChatConfig ? (
            <span className="inline-flex gap-1 items-center">
              {currentChatConfig.name}
              <InformationCircleIcon
                className="h-5 w-5 cursor-pointer text-indigo-600"
                onClick={() => {
                  selectConfig(currentChatConfig.assistant_id);
                }}
              />
            </span>
          ) : null
        }
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebar={
          <ChatList
            chats={filteredChats}
            currentChat={currentChat}
            enterChat={selectChat}
            currentConfig={currentConfig}
            enterConfig={selectConfig}
          />
        }
      >
        {configSchema ? content : null}
      </Layout>
        }
        
      </div>
      
    );
  }
  // if not has token or token is not valid, show login page.
  if(!isTokenValid){
    return (<Login setIsTokenValid={setIsTokenValid}></Login>)
  }
}

export default App;
