const path =require('path')
const fs= require('fs').promises

const deleteFile = async (oldImgPath)=>{
    try {
        const fullPath =path.join(__dirname,'..',oldImgPath);

        try {
            await fs.access(fullPath)
        } catch (error) {
            console.error(`File does not exist: ${fullPath}`);
            return            
        }
        await fs.unlink(fullPath)
        console.log(`Successfully deleted old image: ${fullPath}`);
    } catch (error) {
        console.error(`Error deleting old image: ${error.message}`)
    }
}

const uploadFile =async(file,destination)=>{
    if(!file) return null

    const allowedExtensions = /png|jpeg|jpg|gif|pdf|docx/;
    const fileExtention =path.extname(file.name).toLowerCase();

    if (!allowedExtensions.test(fileExtention)) {
        return res.status(400).send('Only images (png, jpg, jpeg, gif or pdf) are allowed.');
    }

    const filename = `${Date.now()}${fileExtention}`
    const uploadPath =path.join(__dirname,'..',"uploads",destination,filename)

    try {
        await file.mv(uploadPath)
        return `/uploads/${destination}/${filename}`;
    } catch (error) {
        console.error(`Error uploading file: ${error}`);
        return null
    }
}

module.exports = {uploadFile,deleteFile}