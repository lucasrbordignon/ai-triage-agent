import { useEffect, useState } from "react"
import { api } from "./services/api";

function App() {
  const [string, setString] = useState("")
  useEffect(() => {
    api.get("/health").then(res => {
      setString(res.data.status)
    }).catch(err => {
      console.error(err)
    });
  }, [])
    
  return <h1 className="text-xl font-bold underline">Hello world! {string}</h1>
}

export default App
