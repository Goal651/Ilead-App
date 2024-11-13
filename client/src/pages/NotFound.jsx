import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="flex flex-col gap-10 justify-center items-center h-screen">
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <Link className="btn btn-primary" to={"/"}>Return home</Link>
        </div>
    )
}