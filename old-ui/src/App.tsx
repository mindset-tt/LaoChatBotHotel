import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { RoutesManagement } from "./routes/Routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();
  return (
    // <div className="">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <RoutesManagement />
        </QueryClientProvider>
      </BrowserRouter>
    // </div>
  );
}

export default App;
