const transformPayload = (payload) => Object.entries(payload).map((entry) => entry.join(':'));

export default transformPayload;
