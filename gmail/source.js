const getAttachmentMessages = (gmail) => {
    return new Promise((resolve, reject) => {    
        gmail.users.messages.list(      
        {        
            userId: 'me',        
            q: 'has:attachment filename:pdf'      
        },            
        
            (err, res) => {        
                if (err) 
                {                    
                    reject(err);          
                    return;        
                }        
                
                if (!res.data.messages) 
                {                    
                    resolve([]);          
                    return;        
                }   
                const messages = res.data.messages;
                resolve(messages);
            }     
        );  
    });
}

const getAttachments = (gmail, message) => {
    return new Promise((resolve, reject) => {    
        gmail.users.messages.get(      
        {        
            userId: 'me',        
            id: message     
        },            
        
            (err, res) => {        
                if (err) 
                {                    
                    reject(err);          
                    return;        
                }        
                
                if (!res.data.payload.parts) 
                {                    
                    resolve([]);          
                    return;        
                }   
                resolve(res.data.payload.parts);
            }     
        );  
    });
}

const getPDF = (gmail, messageId, attachmentId) => {
    return new Promise((resolve, reject) => {    
        gmail.users.messages.attachments.get(      
        {        
            userId: 'me',        
            messageId: messageId,
            id: attachmentId    
        },            
        
            (err, res) => {        
                if (err) 
                {                    
                    reject(err);          
                    return;        
                }        
                
                if (!res) 
                {                    
                    resolve({});          
                    return;        
                }   
                resolve(res);
            }     
        );  
    });
}

module.exports = {getAttachmentMessages, getAttachments, getPDF};