import React, { useState, useEffect } from 'react';
import { auth, storage, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import './App.css';

 function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [uploadComment, setUploadComment] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
      setPosts(postsData);
    });

    const commentsQuery = query(collection(db, 'comments'), orderBy('timestamp', 'desc'));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
      setComments(commentsData);
    });

    return () => {
      unsubscribe();
      unsubscribePosts();
      unsubscribeComments();
    };
  }, []);

  function criarconta(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        updateProfile(user, {
          displayName: username
        }).then(() => {
          setSuccess('Conta criada com sucesso!');
          setUser(user);
          fecharModalCriar();
        });
      })
      .catch((error) => {
        setError('Erro ao criar a conta: ' + error.message);
      });
  }

  function login(e) {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setSuccess('Login realizado com sucesso!');
      })
      .catch((error) => {
        setError('Erro ao fazer login: ' + error.message);
      });
  }

  function logout() {
    signOut(auth)
      .then(() => {
        setUser(null);
      });
  }

  function abrirModalCriarConta(e) {
    e.preventDefault();
    let modal = document.querySelector('.modalcriarconta');
    modal.style.display = 'block';
  }

  function fecharModalCriar() {
    let modal = document.querySelector('.modalcriarconta');
    modal.style.display = 'none';
  }

  function abrirModalPostar(e) {
    e.preventDefault();
    let modal = document.querySelector('.modalpostar');
    modal.style.display = 'block';
  }

  function fecharModalPostar() {
    let modal = document.querySelector('.modalpostar');
    modal.style.display = 'none';
  }

  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  function handleUpload(e) {
    e.preventDefault();
    if (file) {
      const storageRef = ref(storage, `uploads/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          
        },
        (error) => {
          setError('Erro ao fazer upload: ' + error.message);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            addDoc(collection(db, 'posts'), {
              imageUrl: downloadURL,
              username: user.displayName,
              comment: uploadComment,
              timestamp: serverTimestamp(),
            });
            alert('Upload feito com sucesso!');
            fecharModalPostar();
            setUploadComment('');
            setFile(null);
          });
        }
      );
    } else {
      setError('Por favor, selecione um arquivo primeiro.');
    }
  }

  function handleCommentSubmit(postId, e) {
    e.preventDefault();
    if (comment[postId]?.trim()) {
      addDoc(collection(db, 'comments'), {
        postId: postId,
        username: user.displayName,
        comment: comment[postId],
        timestamp: serverTimestamp(),
      }).then(() => {
        setComment(prevState => ({
          ...prevState,
          [postId]: ''
        }));
      }).catch((error) => {
        setError('Erro ao adicionar comentário: ' + error.message);
      });
    }
  }

  function handleCommentChange(postId, e) {
    const newComment = e.target.value;
    setComment(prevState => ({
      ...prevState,
      [postId]: newComment
    }));
  }

  return (
    <div className="App">
      <div className="header">
        <div className="header__logo">
          <img src="https://www.instagram.com/static/images/web/mobile_nav_type_logo.png/735145cfe0a4.png" alt="Instagram" />
        </div>
        <div className="header__loginForm">
          {user ? (
            <div>
              <span className="user-greeting">Olá, {user.displayName}!</span>
              <button className="logout-button" onClick={logout}>Logout</button>
              <button className="post-button" onClick={abrirModalPostar}>Postar</button>
            </div>
          ) : (
            <form onSubmit={login}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input type="submit" value="Login" />
              <a href="#" onClick={abrirModalCriarConta}>Criar Conta</a>
            </form>
          )}
        </div>
      </div>

      <div className="posts">
        {posts.map(({ id, data }) => (
          <div key={id} className="post">
            <img src={data.imageUrl} alt="Post" />
            <h4><strong>{data.username}</strong></h4>
            <p>{typeof data.comment === 'string' ? data.comment : ''}</p>

            <div className="comments">
              {comments.filter(comment => comment.data.postId === id).map(({ id: commentId, data }) => (
                <div key={commentId} className="comment">
                  <strong>{data.username}</strong> {typeof data.comment === 'string' ? data.comment : ''}
                </div>
              ))}
            </div>

            <form className="comment-form" onSubmit={(e) => handleCommentSubmit(id, e)}>
              <input
                type="text"
                placeholder="Escreva um comentário..."
                value={comment[id] || ''}
                onChange={(e) => handleCommentChange(id, e)}
              />
              <button type="submit">Comentar</button>
            </form>
          </div>
        ))}
      </div>

      <div className="modalcriarconta">
        <div className="formcriarconta">
          <span onClick={fecharModalCriar} className="closemodalcriar">&times;</span>
          <h2>Criar Conta</h2>
          <form onSubmit={criarconta}>
            <input
              type="text"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input type="submit" value="Criar Conta" />
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
      </div>

      <div className="modalpostar">
        <div className="formpostar">
          <span onClick={fecharModalPostar} className="closemodalpostar">&times;</span>
          <h2>Postar</h2>
          <form onSubmit={handleUpload}>
            <input type="file" onChange={handleFileChange} />
            <input
              type="text"
              placeholder="Escreva um comentário..."
              value={uploadComment}
              onChange={(e) => setUploadComment(e.target.value)}
            />
            <input type="submit" value="Postar" />
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
