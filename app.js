import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js"
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js"
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js"

// CONFIGURAÇÃO DO FIREBASE (configurar aqui)
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
}

// Inicializando o Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const moviesPhrases = collection(db, "moviesPhrases")

/* Inicialização da Autenticação Google */
const provider = new GoogleAuthProvider()

// Definir idioma
const auth = getAuth()
auth.languageCode = 'pt-br'

// Inicializando Materialize
M.AutoInit()

const loginButton = document.querySelector('[data-js="logged-out"]')
const googleButton = document.querySelector('[data-js="button-form"]')
const menuOptions = document.querySelectorAll('[data-js="logged-in"]') // [0] adicionar, [1] conta e [2] logout
const logMessage = document.querySelector('[data-js="log-msg"]')
const phrasesList = document.querySelector('[data-js="phrases-list"]')
const loginWithGoogleModal = document.querySelector('[data-js="modal-login"]')
const addPhraseModal = document.querySelector('[data-js="modal-add-phrase"]')
const addForm = document.querySelector('[data-js="add-phrase-form"]')
const userInfo = document.querySelector('[data-js="user-info"]')

const sanitize = string => DOMPurify.sanitize(string)

const changeLogMessage = message => logMessage.textContent =  sanitize(message)

const closeModal = modal =>  M.Modal.getInstance(modal).close()

const handleSnapshotError = error => changeLogMessage(`Um erro ocorreu (${error})`)

const to = promise => promise
  .then(result => [null, result])
  .catch(error => [error])

const changeElementsVisibility = () => {
  loginButton.classList.toggle('hide')
  phrasesList.classList.toggle('hide')
  menuOptions.forEach(option => option.classList.toggle('hide'))
}

// renderização da lista
const renderPhrasesList = querySnapshot => {         
  querySnapshot.docChanges().forEach(docChange =>{  
    const li = document.createElement('li')
    const movieNameContainer = document.createElement('div')
    const movieItemContainer = document.createElement('div')
    const phraseContainer = document.createElement('span')
      
    li.setAttribute('data-js', 'item-list')
    movieNameContainer.setAttribute('class', 'collapsible-header blue-grey darken-4 blue-grey-text text-lighten-5')
    movieItemContainer.setAttribute('class', 'collapsible-body blue-grey darken-4 blue-grey-text text-lighten-5')
      
    movieNameContainer.textContent = docChange.doc.data().movie
    phraseContainer.textContent = docChange.doc.data().phrase
      
    movieItemContainer.append(phraseContainer)
    li.append(movieNameContainer, movieItemContainer)
    phrasesList.append(li)
      
    changeLogMessage(`Seja bem vindo(a)!`)
  })
}

// remover renderização da lista
const removePhrasesListRender = () => {
  const lisList = document.querySelectorAll('[data-js="item-list"]')
  lisList.forEach(li => li.remove())
}

// login
const login = async () => {
  closeModal(loginWithGoogleModal)
  changeLogMessage('Abrindo login do Google, aguarde...')

  const [error] = await to(signInWithPopup(auth, provider))
  
  if(error){
    changeLogMessage(`Não foi possível entrar na sua conta, tente novamente (${error.code}).`)
    return
  }
}

// adicionar frase:
const addNewPhrase = async event => {
  event.preventDefault()
  closeModal(addPhraseModal)
  
  const [error, doc] = await to(addDoc(moviesPhrases, {
    movie: event.target.title.value,
    phrase: event.target.phrase.value
  }))
  
  if(error) {
    changeLogMessage(`Não foi possível adicionar o item (${error})`)
    return
  }

  changeLogMessage(`Item criado com sucesso com o id ${doc.id}`)
  event.target.reset()
  event.target.title.focus()
}

// logout:
const logout = async () => {
  const [error] = await to(signOut(auth))
  
  if(error) {
    changeLogMessage(`Não foi possível deslogar (${error.message})`) 
    return
  }

  changeElementsVisibility()
  changeLogMessage('Você deslogou. Faça login para ver as frases')
}

changeLogMessage('Faça login para ver as frases')

// gerenciar login/logout
const manageUserLog = () => {
  let unsubscribe = null

  onAuthStateChanged(auth, user => {
    if (user) { 
      changeElementsVisibility()
      changeLogMessage('Carregando lista, por favor aguarde...')

      userInfo.textContent = sanitize(`${user.displayName} | ${user.email}`)
      unsubscribe = onSnapshot(moviesPhrases, renderPhrasesList, handleSnapshotError)

    } else {
      if(unsubscribe){
        removePhrasesListRender()
        unsubscribe()
      }
    }
  })
}

// Observador de status
manageUserLog()
// LOGIN
googleButton.addEventListener('click', login)
// ADICIONAR
addForm.addEventListener('submit', addNewPhrase)
// LOGOUT
menuOptions[2].addEventListener('click', logout)



