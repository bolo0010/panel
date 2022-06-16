import TextEditor from './TextEditor';
import 'draft-js/dist/Draft.css';
import '../../scss/Publications/Publications.scss';
import PublicationsTable from './PublicationsTable';
import { CSVLink } from 'react-csv';
import moment from 'moment';
import axios from 'axios';
import { useState } from 'react';
import MainButton from '../addons/MainButton';
import Add from '../Admin/Add';
import { convertFromRaw, EditorState } from 'draft-js';
import { uniqueId } from '../../config/id-generator';
import { useSelector } from 'react-redux';
import { adminRoles } from '../../config/id-roles';

const Publications = () => {
    const id_user = useSelector(({ user }) => user.value.id);

    const [publicationPopOut, setPublicationPopOut] = useState(null);
    const [publicationsDataCSV, setPublicationsDataCSV] = useState({
        data: [{ 'brak_danych': '0' }],
        isDataDownloaded: false
    });

    const disablePublicationPopOut = () => {
        setPublicationPopOut(null);
    };

    const handleDownloadAllPublicationsData = (event, done) => {
        if (!publicationsDataCSV.isDataDownloaded) {
            handleDownloadAllPublicationsDataRequest();
            done(false);
        } else done(true);
    };

    const handleAddPublication = async () => {
        const id = uniqueId();

        try {
            const res = await axios({
                method: 'POST',
                url: '/api/publications',
                withCredentials: true,
                data: {
                    id,
                    id_author: id_user
                }
            });
            if (res.status === 200) {
                setPublicationPopOut(<TextEditor publication_id={res.data.id}
                                                 disablePopout={disablePublicationPopOut} />);
            }
        } catch (err) {
            //TODO zrobić error
        }
    };


    const handleDownloadAllPublicationsDataRequest = async () => {
        try {
            const res = await axios({
                method: 'GET',
                url: '/api/publications',
                withCredentials: true,
                params: {
                    csv: true,
                    page: 0,
                    size: 999999999 //TODO do zmiany na bardziej responsywną wersję
                }
            });
            if (res.status === 200) {
                const publications = res.data.publications.map((publication) => {
                    return {
                        ...publication,
                        content: EditorState.createWithContent(convertFromRaw(JSON.parse(publication.content))).getCurrentContent().getPlainText('\u0001'),
                        author: publication.author.nick,
                        corrector: publication.corrector ? publication.corrector.nick : '',
                        publisher: publication.publisher ? publication.publisher.nick : '',
                        publications_state: publication.publications_state.status,
                        publications_type: publication.publications_type ? publication.publications_type.type_pl : '',
                        publications_route: publication.publications_route ? publication.publications_route.message : ''
                    };
                });
                setPublicationsDataCSV({ data: publications, isDataDownloaded: true });
            }
        } catch (err) {
            //TODO obsłużyć błąd
            console.error(err);
            setPublicationsDataCSV(({ data }) => ({ ...data, isDataDownloaded: false }));
        }
    };

    const csvDownloadButton = (
        <CSVLink
            data={publicationsDataCSV.data}
            filename={`publications-${moment().format('YYYY-MM-DD')}.csv`}
            target='_blank'
            className='main-button main-button--disable-decoration'
            asyncOnClick={true}
            onClick={handleDownloadAllPublicationsData}
        >
            {!publicationsDataCSV.isDataDownloaded ? 'Wygeneruj plik CSV' : 'Pobierz plik CSV'}
        </CSVLink>
    );

    return (
        <>
            <main className='publications-container'>
                {publicationPopOut}
                <div className='publications-control'>
                    <PublicationsTable setPublicationPopOut={setPublicationPopOut}
                                       disablePopOut={disablePublicationPopOut} />
                    <div className='publications-control__buttons'>
                        <div className='control-button control-add'>
                            <MainButton onClick={handleAddPublication} type={'button'} value={'Utwórz publikację'} />
                        </div>
                        {
                            useSelector(({user}) => user.value.adminRoute)
                                ? (
                                    <div className='control-button control-download-all-data'>
                                        {csvDownloadButton}
                                    </div>
                                )
                                : null
                        }

                    </div>
                </div>
            </main>
        </>
    );
};

export default Publications;