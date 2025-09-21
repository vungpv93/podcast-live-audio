import Live from './pages/live';
import { useSocket } from './hooks/useSocket.ts';
import { useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AuthList } from './mock/auth.ts';
import type { IAuth, IUser } from './dto/live-audio.ts';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import NotFound from './pages/404';
import LoadingPage from './components/loading/LoadingPage.tsx';

type AppProps = {
  duuid: string;
};

type PageProps = {
  auth: IAuth;
  socket: Socket;
};

function App({ duuid }: AppProps) {
  const { socket } = useSocket();
  useEffect(() => {
    if (socket?.id) {
      toast.success('The client connected.');
      console.log(`The client duuid is : ${duuid}`);
    }
  }, [duuid, socket?.id]);

  const props: PageProps = useMemo(() => {
    return {
      socket: socket,
      auth: AuthList.host as IUser,
    } as PageProps;
  }, [socket]);

  if (typeof socket === 'undefined') return <LoadingPage />;

  if (!socket?.id) return <NotFound />;

  return (
    <>
      <Router>
        <Routes>
          <Route path="/live/:id" element={<Live {...props} />} />
          {/*<Route path="/live/:id/audience" element={<Live {...props} />} />*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
